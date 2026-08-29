#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "driver/gpio.h"
#include "driver/uart.h"
#include "esp_adc/adc_oneshot.h"

#include "soc/gpio_reg.h"   // REG_WRITE / GPIO_OUT_W1TS_REG / GPIO_OUT_W1TC_REG
#include "esp_rom_sys.h"    // esp_rom_delay_us()


// ============================================================
// Configuration
// ============================================================

// NOTE: this is slower than PyFlexiTac's FlexiTacSensor default
// baud (2_000_000), but far more reliable across USB-serial adapters
// and cables. Keep this in sync with whatever you pass as `baud=`
// on the Python side -- both ends must agree.
#define BAUD_RATE                 115200

#define ROW_COUNT                 16
#define COLUMN_COUNT              32
#define FRAME_PAYLOAD_BYTES       (ROW_COUNT * COLUMN_COUNT)   // 512

// ESP32 DevKit pin configuration -- unchanged from the original wiring
#define PIN_ADC_INPUT             36      // VP / GPIO36

#define PIN_SHIFT_REGISTER_DATA   25
#define PIN_SHIFT_REGISTER_CLOCK  27

// 74HC4067 MUX select pins
#define PIN_MUX_CHANNEL_0         32     // S0
#define PIN_MUX_CHANNEL_1         33     // S1
#define PIN_MUX_CHANNEL_2         12     // S2  (NOTE: strapping pin, see readme note below)
#define PIN_MUX_CHANNEL_3         13     // S3

// 74HC4067 Enable/Inhibit
#define PIN_MUX_INHIBIT_0         18     // EN / INH

#define ROWS_PER_MUX              16
#define MUX_COUNT                 1
#define CHANNEL_PINS_PER_MUX      4

// ------------------------------------------------------------
// Analog settle time.
//
// In the original Arduino/first ESP32 port, the per-byte overhead of
// gpio_set_level()/Serial.write() accidentally gave the mux/analog
// switch line time to settle before each ADC read. Making those
// calls fast (direct register writes + batched UART) removed that
// accidental delay -- which shows up as crosstalk/ghosting: color
// changing in cells you're not touching, or no change where you are.
//
// This puts the settle time back on purpose, as a tunable knob.
// Start at 5us; if you still see ghosting, raise it (try 10, 20, 50).
// If frame rate matters more and readings look clean, try lowering it.
// ------------------------------------------------------------
#define ANALOG_SETTLE_US          5


// ============================================================
// UART configuration
// ============================================================

#define FLEXITAC_UART             UART_NUM_0

#define UART_TX_PIN               1
#define UART_RX_PIN               3

#define UART_BUFFER_SIZE          1024


// ============================================================
// ADC configuration
// GPIO36 = ADC1_CHANNEL_0 on classic ESP32
// ============================================================

#define FLEXITAC_ADC_UNIT         ADC_UNIT_1
#define FLEXITAC_ADC_CHANNEL      ADC_CHANNEL_0


// ============================================================
// Fast, register-level shift-register toggling
// ------------------------------------------------------------
// gpio_set_level() goes through argument validation + a function
// call every time. The shift clock/data lines toggle
// ROW_COUNT * (COLUMN_COUNT + 1) = 528 times per frame, so this is
// the one place worth hand-optimizing -- equivalent to the AVR
// PORTD|= / &=~ bit-banging the original Arduino firmware used.
// Both pins are < 32, so a single GPIO_OUT_W1TS/W1TC register write
// sets/clears them in one instruction.
// ============================================================

#define SR_DATA_BIT               (1u << PIN_SHIFT_REGISTER_DATA)
#define SR_CLK_BIT                (1u << PIN_SHIFT_REGISTER_CLOCK)

static inline void sr_data_high(void) { REG_WRITE(GPIO_OUT_W1TS_REG, SR_DATA_BIT); }
static inline void sr_data_low(void)  { REG_WRITE(GPIO_OUT_W1TC_REG, SR_DATA_BIT); }
static inline void sr_clk_high(void)  { REG_WRITE(GPIO_OUT_W1TS_REG, SR_CLK_BIT); }
static inline void sr_clk_low(void)   { REG_WRITE(GPIO_OUT_W1TC_REG, SR_CLK_BIT); }


// ============================================================
// Global variables
// ============================================================

static int current_enabled_mux = MUX_COUNT - 1;

static adc_oneshot_unit_handle_t adc_handle;

// Whole frame assembled in RAM, then sent with ONE uart_write_bytes()
// call instead of 512 separate 1-byte calls. Each uart_write_bytes()
// call takes a driver mutex and goes through the ring-buffer/FIFO
// path -- doing that 512x per frame is by far the biggest throughput
// cost in the original port.
static uint8_t frame_buf[2 + FRAME_PAYLOAD_BYTES];


// ============================================================
// Function prototypes
// ============================================================

static void gpio_init(void);
static void uart_init(void);
static void adc_init(void);

static void setRow(int row_number);
static void shiftColumn(bool is_first);
static inline int read_adc(void);


// ============================================================
// GPIO initialization
// ============================================================

static void gpio_init(void)
{
    gpio_config_t io_conf = {
        .pin_bit_mask =
            (1ULL << PIN_SHIFT_REGISTER_DATA) |
            (1ULL << PIN_SHIFT_REGISTER_CLOCK) |
            (1ULL << PIN_MUX_CHANNEL_0) |
            (1ULL << PIN_MUX_CHANNEL_1) |
            (1ULL << PIN_MUX_CHANNEL_2) |
            (1ULL << PIN_MUX_CHANNEL_3) |
            (1ULL << PIN_MUX_INHIBIT_0),

        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };

    ESP_ERROR_CHECK(gpio_config(&io_conf));

    // Initial states
    sr_data_low();
    sr_clk_low();

    // MUX disabled initially (74HC4067 EN/INH is active LOW: HIGH = disabled)
    gpio_set_level(PIN_MUX_INHIBIT_0, 1);

    gpio_set_level(PIN_MUX_CHANNEL_0, 0);
    gpio_set_level(PIN_MUX_CHANNEL_1, 0);
    gpio_set_level(PIN_MUX_CHANNEL_2, 0);
    gpio_set_level(PIN_MUX_CHANNEL_3, 0);
}


// ============================================================
// UART initialization
// ============================================================

static void uart_init(void)
{
    uart_config_t uart_config = {
        .baud_rate = BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };

    // tx_buffer_size = 0 -> blocking writes straight into the HW FIFO,
    // which is what we want since we now send one big buffer per frame.
    ESP_ERROR_CHECK(
        uart_driver_install(
            FLEXITAC_UART,
            UART_BUFFER_SIZE,
            UART_BUFFER_SIZE,
            0,
            NULL,
            0
        )
    );

    ESP_ERROR_CHECK(uart_param_config(FLEXITAC_UART, &uart_config));

    ESP_ERROR_CHECK(
        uart_set_pin(
            FLEXITAC_UART,
            UART_TX_PIN,
            UART_RX_PIN,
            UART_PIN_NO_CHANGE,
            UART_PIN_NO_CHANGE
        )
    );
}


// ============================================================
// ADC initialization
// ============================================================

static void adc_init(void)
{
    adc_oneshot_unit_init_cfg_t init_config = {
        .unit_id = FLEXITAC_ADC_UNIT,
        .ulp_mode = ADC_ULP_MODE_DISABLE
    };

    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config, &adc_handle));

    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten = ADC_ATTEN_DB_12   // was ADC_ATTEN_DB_11; renamed/removed in ESP-IDF 6.x
    };

    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc_handle, FLEXITAC_ADC_CHANNEL, &config));
}


// ============================================================
// ADC reading
// ============================================================

static inline int read_adc(void)
{
    int raw_value = 0;
    ESP_ERROR_CHECK(adc_oneshot_read(adc_handle, FLEXITAC_ADC_CHANNEL, &raw_value));
    return raw_value;
}


// ============================================================
// Set MUX row  (unchanged logic, only one physical MUX)
// ============================================================

static void setRow(int row_number)
{
    if ((row_number % ROWS_PER_MUX) == 0)
    {
        gpio_set_level(PIN_MUX_INHIBIT_0, 1);   // disable

        current_enabled_mux++;
        if (current_enabled_mux >= MUX_COUNT)
        {
            current_enabled_mux = 0;
        }

        gpio_set_level(PIN_MUX_INHIBIT_0, 0);   // enable
    }

    // S0 = GPIO32, S1 = GPIO33, S2 = GPIO12, S3 = GPIO13
    gpio_set_level(PIN_MUX_CHANNEL_0, (row_number >> 0) & 1);
    gpio_set_level(PIN_MUX_CHANNEL_1, (row_number >> 1) & 1);
    gpio_set_level(PIN_MUX_CHANNEL_2, (row_number >> 2) & 1);
    gpio_set_level(PIN_MUX_CHANNEL_3, (row_number >> 3) & 1);
}


// ============================================================
// Shift one column -- now uses direct register writes
// ============================================================

static void shiftColumn(bool is_first)
{
    if (is_first)
    {
        sr_data_high();
    }

    sr_clk_high();
    sr_clk_low();

    if (is_first)
    {
        sr_data_low();
    }
}


// ============================================================
// Main application
// ============================================================

void app_main(void)
{
    gpio_init();
    uart_init();
    adc_init();

    current_enabled_mux = MUX_COUNT - 1;

    frame_buf[0] = 0xAA;
    frame_buf[1] = 0x55;

    while (1)
    {
        // ----------------------------------------------------
        // Scan all rows/columns straight into frame_buf
        // ----------------------------------------------------
        uint8_t *payload = &frame_buf[2];

        for (int i = 0; i < ROW_COUNT; i++)
        {
            setRow(i);

            shiftColumn(true);
            shiftColumn(false);
            esp_rom_delay_us(ANALOG_SETTLE_US);   // let column 0 settle before its first read

            uint8_t *row_out = payload + (i * COLUMN_COUNT);

            for (int j = 0; j < COLUMN_COUNT; j++)
            {
                int raw_reading = read_adc();

                // 12-bit (0-4095) -> 8-bit (0-255)
                row_out[j] = (uint8_t)(raw_reading >> 4);

                shiftColumn(false);
                esp_rom_delay_us(ANALOG_SETTLE_US);   // let the next column settle before it's read
            }
        }

        // ----------------------------------------------------
        // Send the whole frame (header + 512 bytes) in ONE call
        // ----------------------------------------------------
        uart_write_bytes(
            FLEXITAC_UART,
            (const char *)frame_buf,
            sizeof(frame_buf)
        );

        // ----------------------------------------------------
        // Required on ESP-IDF: app_main() runs as a FreeRTOS task
        // at a priority above the idle task. A tight while(1) with
        // no blocking call ever lets the idle task run, which trips
        // the Task Watchdog Timer ("Task watchdog got triggered
        // (IDLE)") and reboots the board every few seconds.
        // Arduino's loop() doesn't have this problem because the
        // core yields for you between iterations -- ESP-IDF does not.
        //
        // One tick per frame both fixes this and naturally caps the
        // frame rate near the ~100 Hz the sensor is designed for.
        // If you want a faster ceiling, raise CONFIG_FREERTOS_HZ to
        // 1000 in `idf.py menuconfig` (Component config -> FreeRTOS ->
        // Kernel) so one tick = 1 ms instead of 10 ms.
        // ----------------------------------------------------
        vTaskDelay(1);
    }
}
