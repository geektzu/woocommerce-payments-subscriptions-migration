<?php

/**
 * Class WCPSM_Rest_Subscription
 *
 * The purpose of this class is to register the REST API routes for subscriptions.
 *
 */
class WCPSM_Rest_Payment_Method extends \WP_REST_Controller {

	/**
	 * The single instance of the class.
	 *
	 * @var Object
	 */
	private static $instance = null;

	/**
	 * The list of endpoints.
	 *
	 * @var Array
	 */
	public $endpoints = array();

	/**
	 * Get the single instance of the class.
	 *
	 * @return Rest_Eligibility Returns the single instance of the class.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new WCPSM_Rest_Payment_Method();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->endpoints = array(
			\WP_REST_Server::READABLE =>
			array(
				'get_origin_methods' => 'payments/origin',
				'get_destination_methods' => 'payments/destination',
			),
		);
	}

	/**
	 * Register the routes for the Enrollment Engine Onboarding API.
	 *
	 * @return void
	 */
	public function register_routes() {

		foreach ( $this->endpoints as $method => $endpoints ) {
			foreach ( $endpoints as $route_name => $route_endpoint ) {
				register_rest_route(
					WCPSM_PLUGIN_API_BASE,
					$route_endpoint,
					array(
						array(
							'methods'             => $method,
							'callback'            => array( $this, $route_name ),
							'permission_callback' => array( $this, 'get_items_permissions_check' ),
							'args'                => array(),
						),
					)
				);
			}
		}
	}
	
	public function get_origin_methods( $request ) {
		$params  = $request->get_params();
		$methods = array();
		
		if ( function_exists( 'WC' ) ) {
			$payment_gateways = WC()->payment_gateways->payment_gateways;
			foreach ( $payment_gateways as $gateway ) {
				if ( in_array( $gateway->id, array( 'authorize_net_cim_credit_card', 'stripe', 'elavon_converge_credit_card' ) ) ) {
			        $methods[] = array(
			            'id'   => $gateway->id,
			            'name' => $gateway->get_method_title(),
			        );
		        }
		    }
		}
		
		$data = array(
			'result' => true,
			'data'	 => $methods,
		);

		return rest_ensure_response( $data );
	}
	
	public function get_destination_methods( $request ) {
		$params = $request->get_params();
		$methods = array();
		
		if ( function_exists( 'WC' ) ) {
			$payment_gateways = WC()->payment_gateways->payment_gateways;
			foreach ( $payment_gateways as $gateway ) {
				if ( in_array( $gateway->id, array( 'woocommerce_payments' ) ) ) {
			        $methods[] = array(
			            'id'   => $gateway->id,
			            'name' => $gateway->get_method_title(),
			        );
		        }
		    }
		}

		$data = array(
			'result' => true,
			'data'	 => $methods,
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @param [Object] $request The request object.
	 * @return bool Whether the request has permission to get items.
	 */
	public function get_items_permissions_check( $request ) {
		return get_current_user_id() ? true : false;
	}
}