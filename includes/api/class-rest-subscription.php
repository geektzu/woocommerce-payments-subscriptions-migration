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
		
		$subscriptions = array(
			array(
				'id'		   => "sub_1",
				'name'         => "Subscription 1",
				'message' 	   => "DEU!",
				'success'	   => true,
			),
			array(
				'id'		   => "sub_2",
				'name'         => "Subscription 2",
				'message' 	   => "NAO DEU!",
				'success'	   => false,
			),
			array(
				'id'		   => "sub_3",
				'name' 		   => "Subscription 3",
				'message' 	   => "DEU!",
				'success'	   => true,
			)
		);

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
		
		$subscriptions = array(
			array(
				'id'		   => "sub_1",
				'name' 		   => "Subscription 1",
				'message' 	   => "DEU!",
				'success'	   => true,
			),
			array(
				'id'		   => "sub_2",
				'name' 		   => "Subscription 2",
				'message' 	   => "NAO DEU!",
				'success'	   => false,
			),
			array(
				'id'		   => "sub_3",
				'name' 		   => "Subscription 3",
				'message' 	   => "DEU!",
				'success'	   => true,
			)
		);

		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);

		return rest_ensure_response( $data );
	}

	public function get_subscriptions( $request ) {
		$params 	= $request->get_params();
		$origin_pm  = !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		
		$subscriptions = array(
			array(
				'id' => 'sub_1',
				'name' => 'Subscription 1',
			),
			array(
				'id' => 'sub_2',
				'name' => 'Subscription 2',
			),
			array(
				'id' => 'sub_3',
				'name' => 'Subscription 3',
			)
		);

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
