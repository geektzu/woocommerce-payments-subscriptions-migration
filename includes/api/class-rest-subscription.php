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
				'get_subscriptions' => 'subscriptions',
				'get_subscriptions_rollback' => 'subscriptions/rollback',
				'dry_download' => 'dry-download',
				'dry_download_rollback' => 'dry-download-rollback',
			),
			\WP_REST_Server::CREATABLE =>
			array(
				'dry_migrate' => 'subscriptions/dry-migrate',
				'dry_migrate_rollback' => 'subscriptions/dry-migrate/rollback',
				'migrate'     => 'subscriptions/migrate',
				'rollback'    => 'subscriptions/rollback',
				'validate_subscription_tokens' => 'subscription/tokens',
				'validate_subscription_tokens_rollback' => 'subscription/tokens/rollback',
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
	
	private function get_customer_id_option() {

		return WC_Payments::get_gateway()->is_in_test_mode()
			? WC_Payments_Customer_Service::WCPAY_TEST_CUSTOMER_ID_OPTION
			: WC_Payments_Customer_Service::WCPAY_LIVE_CUSTOMER_ID_OPTION;
	}
	
	private function process_rollback( $subscription_data, $testing = false ) {
		$result = false;
		$subscription_id = !empty( $subscription_data['id'] ) ? intval( $subscription_data['id'] ) : 0;
		$old_token		 = !empty( $subscription_data['source_id'] ) ? sanitize_text_field( $subscription_data['source_id'] ) : "";
		$new_token		 = !empty( $subscription_data['source_id_new'] ) ? sanitize_text_field( $subscription_data['source_id_new'] ) : "";
		$old_customer	 = !empty( $subscription_data['customer_id'] ) ? sanitize_text_field( $subscription_data['customer_id'] ) : "";
		$new_customer	 = !empty( $subscription_data['customer_id_new'] ) ? sanitize_text_field( $subscription_data['customer_id_new'] ) : "";
		$subscription	 = $subscription_id ? wcs_get_subscription( $subscription_id ) : array();
		$origin_pm       = $subscription ? $subscription->get_meta( '_wcpsm_origin_pm' ) : '';
		$origin_pm       = $origin_pm == 'custom' ? 'manual' : $origin_pm;
		if ( !$subscription || !$old_token || !$new_token || !$old_customer || !$new_customer || !$origin_pm ) {
			return false;
		}
		
		try {
			
			$source_key   = $this->get_source_key( $origin_pm );
			$customer_key = $this->get_customer_id_key( $origin_pm );
			$tokens = WC_Payment_Tokens::get_customer_tokens( $subscription->get_customer_id(), 'woocommerce_payments' );
			
			if ( !$testing ) {							
				$subscription->set_payment_method( $origin_pm );
				$subscription->update_meta_data( $source_key, $old_token );
				$subscription->update_meta_data( $customer_key, $old_customer );
				$subscription->delete_meta_data( '_wcpsm_origin_pm' );
				$subscription->delete_meta_data( '_wcpsm_migrated_old');
				$subscription->delete_meta_data( '_wcpsm_migrated' );
				$subscription->save();
			}
			
			$result = true;
			
		} catch ( Exception $e ) {
			$result = false;
		}
		
		return $result;
	}
	
	private function search_payment_token_by_stripe_id( $saved_payment_tokens, $stripe_payment_method_id ) {
		foreach ( $saved_payment_tokens as $saved_payment_token ) {
			if ( $stripe_payment_method_id === $saved_payment_token->get_token() ) {
				return $saved_payment_token;
			}
		}
	}
	
	private function process_migration( $subscription_data, $origin_pm, $destination_pm, $testing = false ) {
		
		$subscription_id = !empty( $subscription_data['id'] ) ? intval( $subscription_data['id'] ) : 0;
		$old_token		 = !empty( $subscription_data['source_id'] ) ? sanitize_text_field( $subscription_data['source_id'] ) : "";
		$new_token		 = !empty( $subscription_data['source_id_new'] ) ? sanitize_text_field( $subscription_data['source_id_new'] ) : "";
		$old_customer	 = !empty( $subscription_data['customer_id'] ) ? sanitize_text_field( $subscription_data['customer_id'] ) : "";
		$new_customer	 = !empty( $subscription_data['customer_id_new'] ) ? sanitize_text_field( $subscription_data['customer_id_new'] ) : "";
		$subscription	 = $subscription_id ? wcs_get_subscription( $subscription_id ) : array();
		if ( !$subscription || !$old_token || !$new_token || !$old_customer || !$new_customer ) {
			return false;
		}
		
		try {
			
			$payments_api_client    = WC_Payments::get_payments_api_client();
			$stripe_payment_methods = $payments_api_client->get_payment_methods( $new_customer, 'card' )['data'];
			$saved_payment_tokens   = WC_Payment_Tokens::get_customer_tokens( $subscription->get_customer_id(), \WCPay\Payment_Methods\CC_Payment_Gateway::GATEWAY_ID );
			
			if ( $testing ) {
				return $stripe_payment_methods ? true : false;
			}
			
			$token = null;
			foreach ( $stripe_payment_methods as $stripe_payment_method ) {
				
				if ( $stripe_payment_method['id'] == $new_token ) {
										
					// Prevents duplication of payment methods.
					$token = $this->search_payment_token_by_stripe_id( $saved_payment_tokens, $stripe_payment_method['id'] );
												
					if ( ! $token ) {
						$token = new WC_Payment_Token_CC();
					}
		
					$token->set_gateway_id( \WCPay\Payment_Methods\CC_Payment_Gateway::GATEWAY_ID );
					$token->set_expiry_month( $stripe_payment_method['card']['exp_month'] );
					$token->set_expiry_year( $stripe_payment_method['card']['exp_year'] );
					$token->set_card_type( strtolower( $stripe_payment_method['card']['brand'] ) );
					$token->set_last4( $stripe_payment_method['card']['last4'] );
					$token->set_token( $stripe_payment_method['id'] );
					$token->set_user_id( $subscription->get_customer_id() );
					$token->save();
				}
			}
			
			if ( $token ) {
				$subscription->add_payment_token( $token );
				$subscription->set_payment_method( $destination_pm );
				$subscription->update_meta_data( '_wcpsm_origin_pm', $origin_pm );
				$subscription->update_meta_data( '_wcpsm_migrated_old', md5( "$old_customer:$old_token" ) );
				$subscription->update_meta_data( '_wcpsm_migrated', md5( "$new_customer:$new_token" ) );
				$subscription->save();

				$global = WC_Payments::is_network_saved_cards_enabled();
				update_user_option( $subscription->get_customer_id(), $this->get_customer_id_option(), $new_customer, $global );
				return true;
			}
		} catch ( Exception $e ) {
			return false;
		}

		return false;
	}
	
	public function rollback( $request ) {
		$params = $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$finished 		 	= !empty( $params['finished'] ) ? $params['finished'] : false;
		$subscriptions_prc  = $this->get_subscription_rollback_data( $sel_subscriptions );
		$subscriptions 		= array();
		foreach ( $subscriptions_prc as $subscription ) {
			$result 	= $subscription['result'];
			$message 	= $subscription['message'];
			
			if ( $result ) {
				$result  = $this->process_rollback( $subscription );
				$message = $result ? 'Valid' : 'Rollback Failed';
			}
			
			$subscriptions[] = array(
				'id'		   => $subscription['id'],
				'name' 		   => $subscription['name'],
				'permalink'    => get_edit_post_link( $subscription['id'] ),
				'message' 	   => $message,
				'success'	   => $result,
			);
		}
		
		if ( $finished ) {
			$user_id = get_current_user_id();
			if ( $user_id ) {
				$this->delete_subscription_rollback_results_file( $user_id );
				$this->delete_subscription_rollback_file( $user_id );
			}
		}

		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);

		return rest_ensure_response( $data );
	}
	
	public function migrate( $request ) {
		$params = $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$origin_pm  	 	= !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$destination_pm  	= !empty( $params['destination_pm'] ) ? $params['destination_pm'] : '';
		$finished 		 	= !empty( $params['finished'] ) ? $params['finished'] : false;
		
		$subscriptions_prc  = $this->get_subscription_data( $sel_subscriptions, $origin_pm, $destination_pm );
		$subscriptions 		= array();
		foreach ( $subscriptions_prc as $subscription ) {
			$result 	= $subscription['result'];
			$message 	= $subscription['message'];
			
			if ( $result ) {
				$result  = $this->process_migration( $subscription, $origin_pm, $destination_pm );
				$message = $result ? 'Valid' : 'Migration Failed';
			}
			
			$subscriptions[] = array(
				'id'		   => $subscription['id'],
				'name' 		   => $subscription['name'],
				'permalink'    => get_edit_post_link( $subscription['id'] ),
				'message' 	   => $message,
				'success'	   => $result,
			);
		}
		
		if ( $finished ) {
			$user_id = get_current_user_id();
			if ( $user_id ) {
				$this->delete_subscription_migration_results_file( $user_id );
				$this->delete_subscription_migration_file( $user_id );
			}
		}

		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);

		return rest_ensure_response( $data );
	}
	
	public function dry_download_rollback( $request ) {
	    $params = $request->get_params();
	    
	    $user_id = get_current_user_id();
	    $csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_rollback_results_$user_id.csv";
	
	    if ( !file_exists( $csv_file_path ) ) {
	        return new WP_Error( 'rest_not_found', __( 'CSV file not found.' ), array( 'status' => 404 ) );
	    }
	
	    // Set headers for the response
	    header('Content-Type: text/csv');
	    header('Content-Disposition: attachment; filename="subscription_rollback_results.csv"');
	    header('Cache-Control: no-cache, no-store, must-revalidate');
	    header('Pragma: no-cache');
	    header('Expires: 0');
	
	    // Read the file and output its contents
	    readfile($csv_file_path);
	
	    // Terminate the script to prevent WordPress from sending any additional content
	    exit;
	}
	
	public function dry_download( $request ) {
	    $params = $request->get_params();
	    
	    $user_id = get_current_user_id();
	    $csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_migration_results_$user_id.csv";
	
	    if ( !file_exists( $csv_file_path ) ) {
	        return new WP_Error( 'rest_not_found', __( 'CSV file not found.' ), array( 'status' => 404 ) );
	    }
	
	    // Set headers for the response
	    header('Content-Type: text/csv');
	    header('Content-Disposition: attachment; filename="subscription_migration_results.csv"');
	    header('Cache-Control: no-cache, no-store, must-revalidate');
	    header('Pragma: no-cache');
	    header('Expires: 0');
	
	    // Read the file and output its contents
	    readfile($csv_file_path);
	
	    // Terminate the script to prevent WordPress from sending any additional content
	    exit;
	}

	
	public function dry_migrate_rollback( $request ) {
		$params 			= $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$page  				= !empty( $params['page'] ) ? $params['page'] : 1;
		
		$subscriptions_prc 	= $this->get_subscription_rollback_data( $sel_subscriptions );
		$subscriptions 		= array();
		foreach ( $subscriptions_prc as $subscription ) {
			
			$result  = $subscription['result'];
			$message = $subscription['message'];
			$warning = $subscription['warning'];
			if ( $result ) {
				$migrated_valid = $this->process_rollback( $subscription, true );
				if ( !$migrated_valid ) {
					$result  = false;
					$message = 'Could not find token on existing payment methods.';
				}
			}
			
			$subscriptions[] = array(
				'id'		   		 => $subscription['id'],
				'name' 		   		 => $subscription['name'],
				'message' 	   		 => $message,
				'success'	   		 => $result,
				'warning'	   		 => $warning,
				'subscription_email' => $subscription['subscription_email'] ?? "",
				'payment_email'		 => $subscription['payment_email'] ?? "",
				'permalink'   		 => get_edit_post_link( $subscription['id'] ),
			);
		}
				
		if ( $subscriptions ) {
			$user_id = get_current_user_id();
			if ( $user_id && $page == 1 ) {
				$this->create_rollback_csv_file( $user_id, $subscriptions, true );
			} else {
				$this->create_rollback_csv_file( $user_id, $subscriptions, false );
			}
		}
		
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);
		
		return rest_ensure_response( $data );
	}
	
	public function dry_migrate( $request ) {
		$params 			= $request->get_params();
		$sel_subscriptions  = ( !empty( $params['subscriptions'] ) && is_array( $params['subscriptions'] ) ) ? $params['subscriptions'] : array();
		$origin_pm  	 	= !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$destination_pm  	= !empty( $params['destination_pm'] ) ? $params['destination_pm'] : '';
		$page  				= !empty( $params['page'] ) ? $params['page'] : 1;
		
		$subscriptions_prc 	= $this->get_subscription_data( $sel_subscriptions, $origin_pm, $destination_pm );
		$subscriptions = array();
		foreach ( $subscriptions_prc as $subscription ) {
			
			$result  = $subscription['result'];
			$message = $subscription['message'];
			$warning = $subscription['warning'];
			if ( $result ) {
				$migrated_valid = $this->process_migration( $subscription, $origin_pm, $destination_pm, true );
				if ( !$migrated_valid ) {
					$result  = false;
					$message = 'Could not find token on existing payment methods.';
				}
			}
			
			$subscriptions[] = array(
				'id'		   		 => $subscription['id'],
				'name' 		   		 => $subscription['name'],
				'message' 	   		 => $message,
				'success'	   		 => $result,
				'warning'	   		 => $warning,
				'subscription_email' => $subscription['subscription_email'] ?? "",
				'payment_email'		 => $subscription['payment_email'] ?? "",
				'permalink'    		 => get_edit_post_link( $subscription['id'] ),
			);
		}
		
		$user_id = get_current_user_id();
		if ( $user_id && $page == 1 ) {
			$this->create_csv_file( $user_id, $subscriptions, true );
		} else {
			$this->create_csv_file( $user_id, $subscriptions, false );
		}
		
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);
		
		return rest_ensure_response( $data );
	}
	
	public function create_rollback_csv_file( $user_id, $subscriptions, $replace = false ) {
		$csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_rollback_results_$user_id.csv";
		
		if ( $replace && file_exists( $csv_file_path ) ) {
			unlink( $csv_file_path ); // Delete the old file
		}
	
		$mode = $replace ? 'w' : 'a';
		$output = fopen( $csv_file_path, $mode );
	
		if ( $replace || !file_exists( $csv_file_path ) ) {
			$headers = array_keys( $subscriptions[0] );
			fputcsv( $output, $headers );
		}
	
		foreach ( $subscriptions as $subscription ) {
			fputcsv( $output, $subscription );
		}
	
		fclose( $output );
	}
	
	/**
	 * Create or append to a CSV file for the migration results.
	 *
	 * @param int $user_id The user ID for file naming.
	 * @param array $subscriptions The subscription data to save.
	 * @param bool $replace Whether to replace the file or append to it.
	 */
	private function create_csv_file( $user_id, $subscriptions, $replace = false ) {
		$csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_migration_results_$user_id.csv";
		
		if ( $replace && file_exists( $csv_file_path ) ) {
			unlink( $csv_file_path ); // Delete the old file
		}
			
		$mode = $replace ? 'w' : 'a';
		$output = fopen( $csv_file_path, $mode );
	
		if ( $replace || !file_exists( $csv_file_path ) ) {
			$headers = array_keys( $subscriptions[0] );
			fputcsv( $output, $headers );
		}
	
		foreach ( $subscriptions as $subscription ) {
			fputcsv( $output, $subscription );
		}
	
		fclose( $output );
	}

	private function get_source_key( $method ) {
		switch ( $method ) {
			case 'stripe':
				return '_stripe_source_id';
				break;
			case 'stripe_cc':
				return '_payment_method_token';
				break;
			case 'authorize_net_cim_credit_card':
				return '_wc_authorize_net_cim_credit_card_payment_token';
				break;
			case 'elavon_converge_credit_card':
				return '_wc_elavon_converge_credit_card_payment_token';
				break;
			case 'braintree_credit_card':
				return '_wc_braintree_credit_card_payment_token';
				break;
			case 'custom':
				return '_wc_dp_payment_token';
				break;
		}
		
		return '';
	}
	
	private function get_customer_id_key( $method ) {
		
		switch ( $method ) {
			case 'stripe':
				return '_stripe_customer_id';
				break;
			case 'stripe_cc':
				return '_wc_stripe_customer';
				break;
			case 'authorize_net_cim_credit_card':
				return '_wc_authorize_net_cim_credit_card_customer_id';
				break;
			case 'elavon_converge_credit_card':
				return '_wc_elavon_converge_credit_card_customer_id';
				break;
			case 'braintree_credit_card':
				return '_wc_braintree_credit_card_customer_id';
				break;
			case 'custom':
				return '_wc_dp_customer_id';
				break;
		}
		
		return '';
	}
	
	private function get_subscription_rollback_data( $subscriptions_raw ) {
		$subscriptions   = array();
	
		// Get the current user's ID
		$user_id = get_current_user_id();
		if ( !$user_id ) {
			return $subscriptions;
		}
	
		// Define the path to the saved CSV file
		$csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_rollback_${user_id}.csv";
	
		// Check if the file exists
		if ( !file_exists( $csv_file_path ) ) {
			return $subscriptions;
		}
	
		// Read the CSV file into an associative array for efficient searching
		$file_data = array();
		if (($handle = fopen($csv_file_path, "r")) !== false) {
			// Read the header
			$header = fgetcsv($handle);
	
			// Ensure the headers match our expected format
			$expected_headers = array('customer_id_old', 'source_id_old', 'customer_id_new', 'source_id_new');
			if ($header !== $expected_headers) {
				fclose($handle);
				return $subscriptions;
			}
	
			// Read the CSV data into an associative array
			while (($row = fgetcsv($handle)) !== false) {
				$token = md5( $row[0] . ':' . $row[1] );
				$file_data[md5( "{$row[0]}:{$row[1]}" )] = array(
					'customer_id_old' => $row[0],
					'source_id_old'   => $row[1],
					'customer_id_new' => $row[2],
					'source_id_new'   => $row[3],
				);
			}
			fclose($handle);
		}
					
		if ( $subscriptions_raw ) {
			foreach ( $subscriptions_raw as $subscription_raw ) {
				$subscription_id 	= !empty( $subscription_raw['id'] ) ? intval( $subscription_raw['id'] ) : 0;
				$subscription_name 	= !empty( $subscription_raw['name'] ) ? sanitize_text_field( $subscription_raw['name'] ) : '';
				if ( $subscription_id ) {
					$valid 		     = false;
					$warning		 = false;
					$error_message   = "Not applicable for rollback. This subscription has no matching token with the CSV file provided. It will be skipped.";
					$subscription    = wcs_get_subscription( $subscription_id );
					$customer_id_old = "";
					$source_id_old   = "";
					$customer_id_new = "";
					$source_id_new   = "";
	
					if ( $subscription ) {
						$migration_token = $subscription->get_meta( '_wcpsm_migrated_old' );
	
						// Check if this combination exists in the CSV data
						if ( $migration_token ) {
							if ( isset( $file_data[$migration_token] ) ) {
								$customer_id_old = $file_data[$migration_token]['customer_id_old'];
								$source_id_old   = $file_data[$migration_token]['source_id_old'];
								$customer_id_new = $file_data[$migration_token]['customer_id_new'];
								$source_id_new   = $file_data[$migration_token]['source_id_new'];
								$valid = true;
							}
						}																		
					}
	
					$subscriptions[ $subscription_id ] = array(
						'id'             	 => $subscription_id,
						'name'           	 => $subscription_name,
						'source_id'      	 => $source_id_old,
						'source_id_new'  	 => $source_id_new,
						'customer_id'    	 => $customer_id_old,
						'customer_id_new'	 => $customer_id_new,
						'subscription_email' => $subscription->get_billing_email(),
						'payment_email'		 => $this->get_payment_email( $customer_id_new, $source_id_new ),
						'result'         	 => $valid,
						'warning'		 	 => $warning,
						'message'        	 => ( $valid && !$warning ) ? "Valid" : $error_message,
					);
				}
			}			
		}
				
		return $subscriptions;
	}
	
	private function get_payment_email( $customer_id, $source_id ) {
		try {			
			$payments_api_client    = WC_Payments::get_payments_api_client();
			$stripe_payment_methods = $payments_api_client->get_payment_methods( $customer_id, 'card' )['data'];
			if ( $stripe_payment_methods ) {
				foreach ( $stripe_payment_methods as $stripe_payment_method ) {
					if ( $stripe_payment_method['id'] === $source_id ) {
						$payment_email = !empty( $stripe_payment_method['billing_details']['email'] ) ? $stripe_payment_method['billing_details']['email'] : '';
						return $payment_email;
					}
				}
			}
		} catch ( Exception $e ) {
			return "";
		}
		
		return "";
	}
		
	private function is_invalid_subscription_email( $subscription, $customer_id, $source_id ) {
		$sub_email 				= $subscription->get_billing_email();
		$payments_api_client    = WC_Payments::get_payments_api_client();
		$stripe_payment_methods = $payments_api_client->get_payment_methods( $customer_id, 'card' )['data'];
		if ( $stripe_payment_methods ) {
			foreach ( $stripe_payment_methods as $stripe_payment_method ) {
				if ( $stripe_payment_method['id'] === $source_id ) {
					$payment_email = !empty( $stripe_payment_method['billing_details']['email'] ) ? $stripe_payment_method['billing_details']['email'] : '';
					if ( $payment_email && $sub_email && $payment_email !== $sub_email ) {
						return "Emails missmatch: Subscription email: $sub_email | Payment email: $payment_email.";
					}
				}
			}
		}
		
		return false;
	}
	
	private function get_subscription_data( $subscriptions_raw, $origin_pm, $destination_pm ) {
		$subscriptions   = array();
		$source_key   	 = $this->get_source_key( $origin_pm );
		$customer_id_key = $this->get_customer_id_key( $origin_pm );
	
		// Get the current user's ID
		$user_id = get_current_user_id();
		if ( !$user_id ) {
			return $subscriptions;
		}
	
		// Define the path to the saved CSV file
		$csv_file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_migration_${user_id}.csv";
	
		// Check if the file exists
		if ( !file_exists( $csv_file_path ) ) {
			return $subscriptions;
		}
	
		// Read the CSV file into an associative array for efficient searching
		$file_data = array();
		if (($handle = fopen($csv_file_path, "r")) !== false) {
			// Read the header
			$header = fgetcsv($handle);
	
			// Ensure the headers match our expected format
			$expected_headers = array('customer_id_old', 'source_id_old', 'customer_id_new', 'source_id_new');
			if ($header !== $expected_headers) {
				fclose($handle);
				return $subscriptions;
			}
	
			// Read the CSV data into an associative array
			while (($row = fgetcsv($handle)) !== false) {
				$file_data[$row[0] . '_' . $row[1]] = array(
					'customer_id_new' => $row[2],
					'source_id_new'   => $row[3],
				);
			}
			fclose($handle);
		}
	
		if ( $source_key && $customer_id_key ) {
			foreach ( $subscriptions_raw as $subscription_raw ) {
				$subscription_id 	= !empty( $subscription_raw['id'] ) ? intval( $subscription_raw['id'] ) : 0;
				$subscription_name 	= !empty( $subscription_raw['name'] ) ? sanitize_text_field( $subscription_raw['name'] ) : '';
				if ( $subscription_id ) {
					$valid 		     = false;
					$warning		 = false;
					$error_message   = "Not applicable for migration. This subscription has no matching token with the CSV file provided. It will be skipped.";
					$subscription    = wcs_get_subscription( $subscription_id );
					$customer_id_new = "";
					$source_id_new   = "";
	
					if ( $subscription ) {						
						$source 	 = $subscription->get_meta( $source_key );
						$customer_id = $subscription->get_meta( $customer_id_key );
	
						// Check if this combination exists in the CSV data
						if ( $source && $customer_id ) {
							$search_key = $customer_id . '_' . $source;
							if ( isset( $file_data[$search_key] ) ) {
								$customer_id_new = $file_data[$search_key]['customer_id_new'];
								$source_id_new   = $file_data[$search_key]['source_id_new'];
								
								$invalid_email = $this->is_invalid_subscription_email( $subscription, $customer_id_new, $source_id_new );
								if ( $invalid_email ) {
									$error_message = $invalid_email;
									$valid = true;
									$warning = true;
								} else {
		
									// Check if there's an existing subscription with destination_pm and matching _stripe_customer_id
									$existing_subscriptions = wcs_get_subscriptions( array(
										'payment_method' => $destination_pm,
										'subscription_status' => array_keys( wcs_get_subscription_statuses() ),
										'meta_query' => array(
											array(
												'key'   => '_wcpsm_migrated',
												'compare' => '=',
												'value' => md5( "$customer_id_new:$source_id_new" )
											),
										),
									));
										
									if ( !empty( $existing_subscriptions ) ) {
										$error_message = "A subscription with the destination payment method already exists with new customer and token data.";
										$valid = true;
										$warning = true;
									} else {
										$valid = true;
									}
								}
							}
						}
																		
						if ( ( strpos( $origin_pm, $subscription->get_payment_method() ) === false && strpos( $subscription->get_payment_method(), $origin_pm ) === false ) && $origin_pm !== 'custom' ) {
							$error_message = "Subscription is from a different payment method (" . $subscription->get_payment_method_title() . ").";
							$valid = false;
						}
					}
	
					$subscriptions[ $subscription_id ] = array(
						'id'             	 => $subscription_id,
						'name'           	 => $subscription_name,
						'source_id'      	 => $source,
						'source_id_new'  	 => $source_id_new,
						'customer_id'    	 => $customer_id,
						'customer_id_new'	 => $customer_id_new,
						'subscription_email' => $subscription->get_billing_email(),
						'payment_email'		 => $this->get_payment_email( $customer_id_new, $source_id_new ),
						'result'         	 => $valid,
						'warning'		 	 => $warning,
						'message'        	 => ( $valid && !$warning ) ? "Valid" : $error_message,
					);
				}
			}			
		}
				
		return $subscriptions;
	}
	
	private function get_file_contents( $uploaded_file ) {
		
	    // Read the file content
	    $file_content = file_get_contents( $uploaded_file['tmp_name'] );
	    $lines = explode( "\n", $file_content );
	
	    // Extract the header row
	    $header = str_getcsv( array_shift( $lines ) );
	
	    $required_headers = array( 'customer_id_old', 'source_id_old', 'customer_id_new', 'source_id_new' );
	    if ( $header !== $required_headers ) {
	        return array();
	    }
	
	    // Initialize an array to store the parsed data
	    $parsed_data = array();
	
	    // Process up to 5 rows for the preview
	    $max_rows = 5;
	    $row_count = 0;
	
	    foreach ( $lines as $line ) {
	        if ( $row_count >= $max_rows ) {
	            break;
	        }
	
	        $row = str_getcsv( $line );
	
	        // Skip empty lines or rows that don't match the header column count
	        if ( empty( $row ) || count( $row ) !== count( $header ) ) {
	            continue;
	        }
	
	        // Combine header with row values
	        $parsed_data[] = array_combine( $header, $row );
	        $row_count++;
	    }
		
	    return $parsed_data;
	}
	
	public function validate_subscription_tokens_rollback( $request ) {
		$files   = $request->get_file_params();
	    $user_id = get_current_user_id();
	
	    // Check if the file exists in the request
	    if ( empty( $files['file'] ) || $files['file']['error'] !== UPLOAD_ERR_OK || !$user_id ) {
	        return rest_ensure_response( array(
	            'result'  => false,
	            'message' => 'No file uploaded or there was an upload error.',
	            'data'    => array(),
	        ) );
	    }
	
	    $uploaded_file = $files['file'];
	
	    // Check file type (ensure it's a CSV)
	    $file_type = !empty( $uploaded_file['type'] ) ? $uploaded_file['type'] : mime_content_type( $uploaded_file['tmp_name'] );
	    if ( $file_type !== 'text/csv' ) {
	        return rest_ensure_response( array(
	            'result'  => false,
	            'message' => 'Invalid file type. Please upload a CSV file.',
	            'data'    => array(),
	        ) );
	    }
	
	    // Validate and get file contents
	    $data = $this->get_file_contents( $uploaded_file );
	    $result = !empty($data);
	
	    // If valid, save the file
	    if ( $result ) {
	        $user_id = get_current_user_id();
	        $upload_path = WCPSM_DIR_PATH . '/assets/csv/';
	        
	        // Ensure the directory exists
	        if ( !file_exists( $upload_path ) ) {
	            wp_mkdir_p( $upload_path );
	        }
	
	        $file_name = "subscription_rollback_$user_id.csv";
	        $file_path = $upload_path . $file_name;
	
	        // Move the uploaded file to the destination
	        if ( !move_uploaded_file( $uploaded_file['tmp_name'], $file_path ) ) {
	            return rest_ensure_response( array(
	                'result'  => false,
	                'message' => 'Error saving the file. Please try again.',
	                'data'    => array(),
	            ) );
	        }
	    }
	
	    // Prepare the response
	    $response_data = array(
	        'result'  => $result,
	        'message' => $result ? "File is Valid and has been saved!" : "Invalid file content.",
	        'data'    => $data,
	    );
	
	    return rest_ensure_response( $response_data );
	}
	
	public function validate_subscription_tokens( $request ) {
	    $files    = $request->get_file_params();
	    $user_id = get_current_user_id();
	
	    // Check if the file exists in the request
	    if ( empty( $files['file'] ) || $files['file']['error'] !== UPLOAD_ERR_OK || !$user_id ) {
	        return rest_ensure_response( array(
	            'result'  => false,
	            'message' => 'No file uploaded or there was an upload error.',
	            'data'    => array(),
	        ) );
	    }
	
	    $uploaded_file = $files['file'];
	
	    // Check file type (ensure it's a CSV)
	    $file_type = !empty( $uploaded_file['type'] ) ? $uploaded_file['type'] : mime_content_type( $uploaded_file['tmp_name'] );
	    if ( $file_type !== 'text/csv' ) {
	        return rest_ensure_response( array(
	            'result'  => false,
	            'message' => 'Invalid file type. Please upload a CSV file.',
	            'data'    => array(),
	        ) );
	    }
	
	    // Validate and get file contents
	    $data = $this->get_file_contents( $uploaded_file );
	    $result = !empty($data);
	
	    // If valid, save the file
	    if ( $result ) {
	        $user_id = get_current_user_id();
	        $upload_path = WCPSM_DIR_PATH . '/assets/csv/';
	        
	        // Ensure the directory exists
	        if ( !file_exists( $upload_path ) ) {
	            wp_mkdir_p( $upload_path );
	        }
	
	        $file_name = "subscription_migration_$user_id.csv";
	        $file_path = $upload_path . $file_name;
	
	        // Move the uploaded file to the destination
	        if ( !move_uploaded_file( $uploaded_file['tmp_name'], $file_path ) ) {
	            return rest_ensure_response( array(
	                'result'  => false,
	                'message' => 'Error saving the file. Please try again.',
	                'data'    => array(),
	            ) );
	        }
	    }
	
	    // Prepare the response
	    $response_data = array(
	        'result'  => $result,
	        'message' => $result ? "File is Valid and has been saved!" : "Invalid file content.",
	        'data'    => $data,
	    );
	
	    return rest_ensure_response( $response_data );
	}	
	
	private function is_hpos() {
		if ( class_exists( 'Automattic\WooCommerce\Utilities\OrderUtil' ) && Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() && get_option( 'woocommerce_custom_orders_table_data_sync_enabled' ) != 'yes' ) {
		    return true;
		}
		
		return false;
	}
	
	private function get_equivalent_methods( $method ) {
		$methods = array( $method );
		return $methods;
	}
	
	private function get_rollback_subscriptions() {
		
		$args = array(
			'post_type'      => 'shop_subscription',
			'posts_per_page' => 5000,
			'fields'		 => 'ids',
			'post_status'    => array_keys( wcs_get_subscription_statuses() ),
			'meta_query'     => array(
				array(
					'key'     => '_wcpsm_origin_pm',
					'compare' => 'EXISTS'
				),
				array(
					'key'     => '_wcpsm_migrated_old',
					'compare' => 'EXISTS'
				),
				array(
					'key'     => '_wc_dp_payment_token',
					'compare' => 'NOT EXISTS'
				),
				array(
					'key'     => '_wc_dp_customer_id',
					'compare' => 'NOT EXISTS'
				),
			),
		);
				
		return get_posts( $args );
	}
	
	private function get_subscriptions_by_payment_method( $method ) {
			
		$methods 		 = $this->get_equivalent_methods( $method );
		$subscriptions   = array();
		$is_hpos_enabled = $this->is_hpos();		
		if ( $method == 'custom' ) {
			$args = array(
				'post_type'      => 'shop_subscription',
				'posts_per_page' => 5000,
				'fields'		 => 'ids',
				'post_status'    => array_keys( wcs_get_subscription_statuses() ),
				'meta_query'     => array(
					array(
						'key'     => '_wc_dp_payment_token',
						'compare' => 'EXISTS'
					),
					array(
						'key'     => '_wc_dp_customer_id',
						'compare' => 'EXISTS'
					),
					array(
						'key'     => '_wcpsm_migrated',
						'compare' => 'NOT EXISTS'
					),
				),
			);
			
			$subscriptions = get_posts( $args );
		} else {
			if ( $is_hpos_enabled ) {
				global $wpdb;
				$table_name = $wpdb->prefix . 'wc_orders';
	
				// Prepare placeholders for SQL IN clause
				$placeholders = implode( ',', array_fill( 0, count( $methods ), '%s' ) );
								
				$query = $wpdb->prepare(
			        "SELECT * FROM $table_name WHERE type = %s AND payment_method IN ($placeholders) LIMIT 5000",
			        array_merge( array( 'shop_subscription' ), $methods ) // First is the type, then the methods
			    );
				
				$subscriptions = $wpdb->get_col( $query );
			} else {		    
				$args = array(
					'post_type'      => 'shop_subscription',
					'posts_per_page' => 5000,
					'fields'		 => 'ids',
					'post_status'    => array_keys( wcs_get_subscription_statuses() ),
					'meta_query'     => array(
						array(
							'key'     => '_payment_method', // Meta key for payment method
							'value'   => $methods, // Use array of methods
							'compare' => 'IN' // Use 'IN' for array comparison
						),
					),
				);
			
				$subscriptions = get_posts( $args );
			}
		}
		
		return $subscriptions;
	}
	
	public function get_subscriptions_rollback( $request ) {
		$params 	   = $request->get_params();
		$subscriptions = array();
		
		if ( class_exists( 'WC_Subscriptions' ) ) {
		    $subscriptions_ids = $this->get_rollback_subscriptions();
		    foreach ( $subscriptions_ids as $subscription_id ) {
			    $subscription_obj = wcs_get_subscription( $subscription_id );
			    $subscriptions[] = array(
				    'id' 		=> $subscription_id,
					'name' 		=> "Subscription #" . $subscription_id,
					'permalink' => get_edit_post_link( $subscription_id ),
			    );			    
		    }		    
		}
		
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);
		
		return rest_ensure_response( $data );
	}

	public function get_subscriptions( $request ) {
		$params 	   = $request->get_params();
		$origin_pm     = !empty( $params['origin_pm'] ) ? $params['origin_pm'] : '';
		$subscriptions = array();
		
		if ( class_exists( 'WC_Subscriptions' ) ) {
					
		    $subscriptions_ids = $this->get_subscriptions_by_payment_method( $origin_pm );
		    foreach ( $subscriptions_ids as $subscription_id ) {
			    $subscription_obj = wcs_get_subscription( $subscription_id );
			    $subscriptions[] = array(
				    'id' 		=> $subscription_id,
					'name' 		=> "Subscription #" . $subscription_id,
					'permalink' => get_edit_post_link( $subscription_id ),
			    );			    
		    }		    
		}
								
		$data = array(
			'result' => true,
			'data'	 => $subscriptions,
		);
		
		return rest_ensure_response( $data );
	}
	
	public function delete_subscription_migration_results_file( $user_id ) {
	    $file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_migration_results_$user_id.csv";
	    if ( file_exists( $file_path ) ) {
	        if ( unlink( $file_path ) ) {
	            return true;
	        } else {
	            return false; 
	        }
	    }
	
	    return false;
	}
	
	public function delete_subscription_migration_file( $user_id ) {
	    $file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_migration_$user_id.csv";
	    if ( file_exists( $file_path ) ) {
	        if ( unlink( $file_path ) ) {
	            return true;
	        } else {
	            return false; 
	        }
	    }
	
	    return false;
	}
	
	public function delete_subscription_rollback_results_file( $user_id ) {
	    $file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_rollback_results_$user_id.csv";
	    if ( file_exists( $file_path ) ) {
	        if ( unlink( $file_path ) ) {
	            return true;
	        } else {
	            return false; 
	        }
	    }
	
	    return false;
	}
	
	public function delete_subscription_rollback_file( $user_id ) {
	    $file_path = WCPSM_DIR_PATH . "/assets/csv/subscription_rollback_$user_id.csv";
	    if ( file_exists( $file_path ) ) {
	        if ( unlink( $file_path ) ) {
	            return true;
	        } else {
	            return false; 
	        }
	    }
	
	    return false;
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