<?php

/**
 * Class WCPSM_Rest_Subscription
 *
 * The purpose of this class is to register the REST API routes for subscriptions.
 *
 */
class WCPSM_Rest_Subscription extends WP_REST_Controller {

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
			self::$instance = new WCPSM_Rest_Subscription();
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
				'get_subscriptions'     => 'subscriptions',
			),
			\WP_REST_Server::CREATABLE =>
			array(
				'dry_migrate' => 'subscriptions/dry-migrate',
				'migrate'     => 'subscriptions/migrate',
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
	
	public function migrate( $request ) {
		$params = $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$origin_pm  	 	= !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$destination_pm  	= !empty( $params['destination_pm'] ) ? $params['destination_pm'] : '';
		
		$subscriptions = array();
		foreach ( $sel_subscriptions as $subscription ) {
			$result = ( $subscription['id'] * 1 ) % 3 == 0 ? true : false;
			$subscriptions[] = array(
				'id'		   => $subscription['id'],
				'name' 		   => $subscription['name'],
				'message' 	   => $result ? "Success!" : "Failed!",
				'success'	   => $result,
			);
		} 

		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);

		return rest_ensure_response( $data );
	}
	
	public function dry_migrate( $request ) {
		$params = $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$origin_pm  	 	= !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$destination_pm  	= !empty( $params['destination_pm'] ) ? $params['destination_pm'] : '';
		
		$subscriptions = array();
		foreach ( $sel_subscriptions as $subscription ) {
			$result = ( $subscription['id'] * 1 ) % 3 == 0 ? true : false;
			$subscriptions[] = array(
				'id'		   => $subscription['id'],
				'name' 		   => $subscription['name'],
				'message' 	   => $result ? "Success!" : "Failed!",
				'success'	   => $result,
			);
		} 
		
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);

		return rest_ensure_response( $data );
	}
	
	private function is_hpos() {
		if ( class_exists( 'Automattic\WooCommerce\Utilities\OrderUtil' ) && Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() && get_option( 'woocommerce_custom_orders_table_data_sync_enabled' ) != 'yes' ) {
		    return true;
		}
		
		return false;
	}
	
	private function get_subscriptions_by_payment_method( $method ) {
		
		$subscriptions   = array();
		$is_hpos_enabled = $this->is_hpos();;
		
		if ( $is_hpos_enabled ) {
			global $wpdb;
			$table_name = $wpdb->prefix . 'wc_orders';
		    $query 		= $wpdb->prepare(
		        "SELECT * FROM $table_name WHERE type = %s AND payment_method = %s",
		        'shop_subscription',
		        $method
		    );
		    
		    $subscriptions = $wpdb->get_col( $query );
		} else {		    
		    $args = array(
		        'post_type'      => 'shop_subscription',
		        'posts_per_page' => -1,
		        'fields'		 => 'ids',
		        'post_status'    => array_keys( wcs_get_subscription_statuses() ),
		        'meta_query'     => array(
		            array(
		                'key'     => '_payment_method', // Meta key for payment method
		                'value'   => $method,
		                'compare' => '='
		            ),
		        ),
		    );
		
		    $subscriptions = get_posts( $args );
	    }
	    
	    return $subscriptions;
	}

	public function get_subscriptions( $request ) {
		$params 	   = $request->get_params();
		$origin_pm     = !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$subscriptions = array();
		
		if ( class_exists( 'WC_Subscriptions' ) ) {
					
		    $subscriptions_ids = $this->get_subscriptions_by_payment_method( $origin_pm );
		    foreach ( $subscriptions_ids as $subscription_id ) {
			    $subscriptions[] = array(
				    'id' 	=> $subscription_id,
					'name' 	=> "Subscription #" . $subscription_id,
			    );
		    }
		}
				
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
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
