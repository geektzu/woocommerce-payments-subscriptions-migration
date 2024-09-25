<?php
	
/**
 * This class is responsible for instanciaing the rest api routes for the Subscription Migration.
 *
 */
class WCPSM_Rest {

	/**
	 * The endpoints.
	 *
	 * @var array
	 */
	public $apis = array();
	
	/**
	 * The single instance of the class.
	 *
	 * @var [type]
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 */
	public function __construct() {

		// Register rest api routes.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		// Set endpoints on variable.
		add_action( 'init', array( $this, 'set_api_endpoints' ), 9 );		
	}
	
	/**
	 * Get the single instance of the class.
	 *
	 * @return Settings Returns the single instance of the class.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new WCPSM_Rest();
		}

		return self::$instance;
	}

	/**
	 * Set the api endpoints.
	 *
	 * @return void
	 */
	public function set_api_endpoints() {
		$this->apis[] = WCPSM_Rest_Subscription::get_instance();
		$this->apis[] = WCPSM_Rest_Payment_Method::get_instance();
	}
	
	public function get_api_endpoints() {
		$endpoints = array();
		foreach ( $this->apis as $api ) {
			if ( $api->endpoints ) {
				if ( $api->endpoints ) {
					foreach ( $api->endpoints as $method => $m_endpoints ) {
						if ( $m_endpoints ) {
							foreach ( $m_endpoints as $m_endpoint_k => $m_endpoint ) {
								$endpoints[ $m_endpoint_k ] = WCPSM_PLUGIN_API_BASE . '/' . $m_endpoint;
							}
						}
					}
				}
			}
		}
		
		return $endpoints;
	}


	/**
	 * Register the rest api routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		foreach ( $this->apis as $api ) {
			$api->register_routes();
		}
	}
}