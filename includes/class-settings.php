<?php
/**
 * Settings class
 *
 * @package WCPSM_Migrate
 */



if ( ! defined( 'ABSPATH' ) ) {
	exit(); // Exit if accessed directly.
}

/**
 * Class Settings
 */
class WCPSM_Settings {

	/**
	 * Settings.
	 *
	 * @var array
	 */
	private $settings = array();

	/**
	 * Instance of this class.
	 *
	 * @var Settings
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 */
	public function __construct() {

		// Initialize settings class.
		$this->init_settings();

		// Add SD Settings Menu.
		add_action( 'admin_menu', array( $this, 'sd_menu' ), 12 );

		// Enqueue settings scripts and styles.
		add_action( 'admin_enqueue_scripts', array( $this, 'settings_scripts' ) );
	}

	/**
	 * Get the instance of this class.
	 *
	 * @return Settings
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new Settings();
		}

		return self::$instance;
	}

	/**
	 * Initialize settings.
	 *
	 * @return void
	 */
	private function init_settings() {
		$fields = get_option( 'stride_settings', array() );
		if ( $fields ) {
			$this->settings = $fields;
		}
	}

	/**
	 * Update a field in the settings.
	 *
	 * @param string $field Field name.
	 * @param string $value Field value.
	 *
	 * @return void
	 */
	public function update_field( $field, $value = '' ) {

		if ( ! $value && isset( $_POST[ $field ] ) ) {
			$value = sanitize_text_field( $_POST[ $field ] );
		}

		$this->settings[ $field ] = $value;
	}

	/**
	 * Get a field from the settings.
	 *
	 * @param string $field Field name.
	 * @param string $default Default value.
	 *
	 * @return string
	 */
	public function get_field( $field, $default = '' ) {

		if ( isset( $this->settings[ $field ] ) && $this->settings[ $field ] ) {
			return $this->settings[ $field ];
		}

		return $default;
	}

	/**
	 * Save settings.
	 *
	 * @return void
	 */
	public function save() {

		update_option( 'stride_settings', $this->settings );

		$cache = Cache_Manager::get_instance();
		$cache->clear_all_cache();
	}

	/**
	 * Enqueue settings scripts.
	 *
	 * @param string $hook The current admin page.
	 *
	 * @return void
	 */
	public function settings_scripts( $hook ) {
		// Enqueue scripts here.
	}

	/**
	 * Add settings menu.
	 *
	 * @return void
	 */
	public function sd_menu() {
		add_options_page( __( 'Migration Settings', 'sd-scaffold-plugin' ), __( 'Migration Settings', 'sd-scaffold-plugin' ), 'manage_options', 'sd-settings-page', array( $this, 'settings_page' ), 10 );
	}

	/**
	 * Settings page.
	 *
	 * @return void
	 */
	public function settings_page() {

		$result = $this->save_settings_page();
		$this->display_settings_page( $result );
	}

	/**
	 * Save settings page.
	 *
	 * @return string
	 */
	public function save_settings_page() {

		$result = '';

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {

			if ( isset( $_POST['sd_site_mode'] ) && check_admin_referer( 'sd_settings_nonce', 'sd_settings_nonce_field' ) ) {
				$this->update_field( 'sd_site_mode' );
			}

			$this->save();

			$result = __( 'Settings updated', 'sd-scaffold-plugin' );

			if ( isset( $_POST['k12_tools_change_button'] ) && sanitize_text_field( wp_unslash( $_POST['k12_tools_change_button'] ) ) ) {
				$this->maybe_process_tools();
			}
		}

		return $result;
	}

	/**
	 * Display settings page.
	 *
	 * @param string $result Result message.
	 *
	 * @return void
	 */
	public function display_settings_page( $result ) {

		?><div class="wrap">

			<?php if ( '' !== $result ) { ?>
				<form method="post" action="">
					<?php wp_nonce_field( 'sd_settings_nonce', 'sd_settings_nonce_field' ); ?>
				<div class="updated">
					<p><?php echo esc_html( $result ); ?></p>
				</div>
			<?php } ?>
			<h2><?php esc_html_e( 'Migration Settings', 'sd-scaffold-plugin' ); ?></h2>

			<div id="migration-root"></div>
			</br>

		</div>
		<?php
	}
}
