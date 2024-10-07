<?php
/*
Plugin Name: WooCommerce Payments Subscriptions Migration
Description: Migrates stripe subscriptions to WooCommerce Payments via CSV file.
Version: 1.0
Author: Marcel Schmitz
Text Domain: wcpay-subscriptions-migration
Domain Path: /languages
Author URI: https://app.codeable.io/tasks/new?preferredContractor=22877
License: GPLv2
*/

if ( ! class_exists( 'wcpay_subscriptions_migration' ) ) {

	class wcpay_subscriptions_migration {

		private static $instance = null;
		private static $data     = array();
		public static function get_instance() {

			if ( self::$instance == null ) {
				self::$instance = new wcpay_subscriptions_migration();
			}

			return self::$instance;
		}

		public function __construct() {

			// Include required files
			add_action( 'plugins_loaded', array( $this, 'includes' ), 12 );

			// Register extensions
			add_action( 'admin_enqueue_scripts', array( $this, 'register_extensions' ) );

			// Add plugin internationalization
			add_action( 'init', array( $this, 'load_textdomain' ) );

			// Register blocks that lack a registration php script.
			add_action( 'init', array( $this, 'register_blocks' ) );
		}

		// Show notice if WooCommerce is not active
		public function woocommerce_error_activation_notice() {

			$notice = __( 'You need WooCommerce active in order to use WooCommerce Payments Subscriptions Migration.', 'wcpay-subscriptions-migration' );
			echo "<div class='error'><p><strong>$notice</strong></p></div>";
		}

		// Show notice if WCPay is not active
		public function wcpay_error_activation_notice() {

			$notice = __( 'You need WooCommerce Payments active in order to use WooCommerce Payments Subscriptions Migration.', 'wcpay-subscriptions-migration' );
			echo "<div class='error'><p><strong>$notice</strong></p></div>";
		}

		// Include needed files and classes
		public function includes() {

			if ( ! class_exists( 'WooCommerce' ) ) {
				add_action( 'admin_notices', array( $this, 'woocommerce_error_activation_notice' ) );
			} elseif ( ! class_exists( 'WC_Payments' ) ) {
				add_action( 'admin_notices', array( $this, 'wcpay_error_activation_notice' ) );
			} else {

				include_once WCPSM_DIR_PATH . 'includes/api/class-rest.php';
				include_once WCPSM_DIR_PATH . 'includes/api/class-rest-subscription.php';
				include_once WCPSM_DIR_PATH . 'includes/api/class-rest-payment-method.php';

				WCPSM_Rest::get_instance();

				if ( is_admin() ) {

					include_once WCPSM_DIR_PATH . 'includes/admin/token-migrate.php';
					include_once WCPSM_DIR_PATH . 'includes/admin/admin.php';
					include_once WCPSM_DIR_PATH . 'includes/admin/migrate.php';
					include_once WCPSM_DIR_PATH . 'includes/class-settings.php';

					new WCPSM_Admin();
					new WCPSM_Settings();
				}
			}
		}

		// Load plugin textdomain
		public function load_textdomain() {
			load_plugin_textdomain( 'wcpay-subscriptions-migration', false, dirname( WCPSM_PLUGIN_BASENAME ) . '/languages' );
		}

		/**
		 * Searches for block.json files in the blocks directory and registers them.
		 *
		 * @return void
		 */
		public function register_blocks() {
			$blocks_directory = plugin_dir_path( __FILE__ ) . 'build/blocks/';

			if ( ! is_dir( $blocks_directory ) ) {
				return;
			}

			$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $blocks_directory ) );
			$blocks   = array();

			foreach ( $iterator as $file ) {

				$path = $file->getPath();
				if ( "$path/" !== $blocks_directory ) {
					if ( ! isset( $blocks[ $path ] ) ) {
						$blocks[ $path ] = '';
					}
				}
			}

			foreach ( $blocks as $block_path => $block_file ) {
				if ( ! $block_file ) {
					$block_path = str_replace( 'src', 'build', $block_path );
					if ( file_exists( "$block_path/block.json" ) ) {
						$args = apply_filters( 'sd_scaffold_plugin_filter_block_args', array(), $block_path );
						register_block_type( $block_path, $args );
					}
				}
			}
		}

		/**
		 * Searches for block.json files in the blocks directory and registers them.
		 *
		 * @return void
		 */
		public function register_extensions() {
			$script     = 'index';
			$name       = 'migration-app';
			$path       = WCPSM_DIR_PATH;
			$asset_file = include WCPSM_DIR_PATH . '/build-extensions/' . $script . '.asset.php';

			wp_register_script( $name, WCPSM_DIR_URL . 'build-extensions/' . $script . '.js', $asset_file['dependencies'], $asset_file['version'], true );
			wp_enqueue_script( $name );

			$rest      = WCPSM_Rest::get_instance();
			$endpoints = $rest->get_api_endpoints();

			// Localize
			wp_localize_script(
				$name,
				'wcpsm_migration_data',
				array(
					'nonce'     => wp_create_nonce( 'wp_rest' ),
					'endpoints' => $endpoints,
					'base_api'	=> rest_url(),
					'per_page'  => 10,
					'download_sample_csv' => WCPSM_DIR_URL . '/sample.csv',
				)
			);

			wp_register_style( $name, WCPSM_DIR_URL . 'build-extensions/index.css', array(), $asset_file['version'] );
			wp_enqueue_style( $name );

			// Enqueue block editor styles.
			wp_enqueue_style( 'wp-edit-blocks' );
		}
	}
}

if ( class_exists( 'wcpay_subscriptions_migration' ) ) {

	if ( ! defined( 'ABSPATH' ) ) {
		exit; // Exit if accessed directly
	}

	define( 'WCPSM_DIR_PATH', plugin_dir_path( __FILE__ ) );
	define( 'WCPSM_DIR_URL', plugin_dir_url( __FILE__ ) );
	define( 'WCPSM_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
	define( 'WCPSM_PLUGIN_FILE', __FILE__ );
	define( 'WCPSM_PLUGIN_VERSION', '1.0' );
	define( 'WCPSM_PLUGIN_API_BASE', 'wcpsm-api' );

	wcpay_subscriptions_migration::get_instance();
}
