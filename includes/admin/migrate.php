<?php

if ( ! class_exists( 'WCPSM_Migrate' ) ) {

	/**
	 * Handles Migrate feature.
	*/

	class WCPSM_Migrate {

		private $data = array();
		private $file = false;
		private $mode = '';
		private $error;

		public function __construct() {}

		// Initialize wizard form
		public function initialize() {

			$this->get_data_file();

			echo '<div class="wrap">';
			echo '<h1>' . __( 'Subscription Migration', 'wcpay-subscriptions-migration' ) . '</h1>';
			if ( $this->error ) {
				echo '<p>' . $this->error . '</p>';
			}

			if ( ! $this->data ) {
				$this->get_page_1();
			} elseif ( $this->file ) {
				$this->get_page_2();
			} else {
				if ( ! $this->mode ) {
					$this->get_page_3_migrate();
				} else {
					$this->get_page_3_rollback();
				}
			}

			echo '</div>';
		}

		public function get_page_3_rollback() {

			$html  = '<div class="wcpsm_migrate_page container mt-3" id="wcpsm_migrate_page_3">';
			$html .= '<div>';
			$html .= '<h4>' . __( 'Step 3/3 - Rollback Result', 'wcpay-subscriptions-migration' ) . '</h4>';

			if ( $this->data ) {

				$html .= '<table>';
				$html .= '<tr>
					<th>' . __( 'Subscription', 'wcpay-subscriptions-migration' ) . '</th>
					<th>' . __( 'Result', 'wcpay-subscriptions-migration' ) . '</th>
				</tr>';

				foreach ( $this->data as $subscription ) {

					$customer_id  = $subscription['customer_id'];
					$old_id       = $subscription['old_id'];
					$new_id       = $subscription['new_id'];
					$subscription = $this->get_subscription( $customer_id, $old_id );

					if ( $subscription ) {
						$subscription_id   = $subscription->get_id();
						$status            = $subscription->get_status();
						$subscription_edit = get_edit_post_link( $subscription_id );
						$subscription_span = '<a target="_blank" href="' . $subscription_edit . '">' . __( "Subscription #$subscription_id - $status", 'wcpay-subscriptions-migration' ) . '</a>';
						$result            = $this->rollback_subscription( $subscription, $old_id, $new_id, $customer_id );
						$message           = $result ? '<span class="wcpsm-success">' . __( 'Rollback success', 'wcpay-subscriptions-migration' ) . '</span>' : '<span class="wcpsm-error">' . __( 'Rollback error', 'wcpay-subscriptions-migration' ) . '</span>';
						$subscription_id   = $subscription->get_id();
						$html             .= '<tr>
							<td>' . $subscription_span . '</td>
							<td>' . $message . '</td>
						</tr>';
					}
				}

				$html .= '</table>';

			}
			$html .= '</div>';
			$html .= '</div>';

			echo $html;
		}

		public function get_page_3_migrate() {

			$html  = '<div class="wcpsm_migrate_page container mt-3" id="wcpsm_migrate_page_3">';
			$html .= '<div>';
			$html .= '<h4>' . __( 'Step 3/3 - Migration Result', 'wcpay-subscriptions-migration' ) . '</h4>';

			if ( $this->data ) {

				$html .= '<table>';
				$html .= '<tr>
					<th>' . __( 'Subscription', 'wcpay-subscriptions-migration' ) . '</th>
					<th>' . __( 'Result', 'wcpay-subscriptions-migration' ) . '</th>
				</tr>';

				foreach ( $this->data as $subscription ) {

					$old_customer_id = $subscription['customer_id'];
					$customer_id     = $subscription['customer_id'];
					$old_id          = $subscription['old_id'];
					$new_id          = $subscription['new_id'];
					$customer_id     = $subscription['old_customer_id'] ? $subscription['old_customer_id'] : $customer_id;
					$change_customer = ( $subscription['old_customer_id'] && $subscription['old_customer_id'] != $subscription['customer_id'] ) ? true : false;

					$subscription = $this->get_subscription( $customer_id, $old_id );

					if ( $subscription ) {
						$subscription_id   = $subscription->get_id();
						$status            = $subscription->get_status();
						$subscription_edit = get_edit_post_link( $subscription_id );
						$subscription_span = '<a target="_blank" href="' . $subscription_edit . '">' . __( "Subscription #$subscription_id - $status", 'wcpay-subscriptions-migration' ) . '</a>';
						$result            = $this->migrate_subscription( $subscription, $old_id, $new_id, $old_customer_id, $change_customer );
						$message           = $result ? '<span class="wcpsm-success">' . __( 'Migration success', 'wcpay-subscriptions-migration' ) . '</span>' : '<span class="wcpsm-error">' . __( 'Migration error', 'wcpay-subscriptions-migration' ) . '</span>';
						$subscription_id   = $subscription->get_id();
						$html             .= '<tr>
							<td>' . $subscription_span . '</td>
							<td>' . $message . '</td>
						</tr>';
					}
				}

				$html .= '</table>';
			}

			$html .= '</div>';
			$html .= '</div>';

			echo $html;
		}

		public function get_page_2() {

			$html  = '<div class="wcpsm_migrate_page container mt-3" id="wcpsm_migrate_page_2">';
			$html .= '<div>';
			$html .= '<h4>' . __( 'Step 2/3 - Validate Associations', 'wcpay-subscriptions-migration' ) . '</h4>';

			if ( $this->data && is_array( $this->data ) ) {
				$html      .= '<table>';
				$sub_exists = false;
				$html      .= '<tr>
						<th>' . __( 'Customer ID', 'wcpay-subscriptions-migration' ) . '</th>
						<th>' . __( 'Old ID', 'wcpay-subscriptions-migration' ) . '</th>
						<th>' . __( 'New ID', 'wcpay-subscriptions-migration' ) . '</th>
						<th>' . __( 'Status', 'wcpay-subscriptions-migration' ) . '</th>
					</tr>';

				foreach ( $this->data as $subscription ) {
					$customer_id = $subscription['customer_id'];
					$old_id      = $subscription['old_id'];
					$new_id      = $subscription['new_id'];

					if ( ! $this->mode ) {
						$customer_id = $subscription['old_customer_id'] ? $subscription['old_customer_id'] : $customer_id;
					}

					$status = $this->get_subscription_status( $customer_id, $old_id );

					if ( ! $status ) {
						$status = __( 'No subscription was found', 'wcpay-subscriptions-migration' );
					} else {
						$sub_exists = true;
					}
					$html .= '<tr>
						<td>' . $customer_id . '</td>
						<td>' . $old_id . '</td>
						<td>' . $new_id . '</td>
						<td>' . $status . '</td>
					</tr>';
				}
				$html .= '</table>';

				if ( $sub_exists ) {
					$json_data = json_encode( $this->data );
					$mode      = $this->mode;
					$action    = menu_page_url( 'pl-wcpsm-migration', false );
					$btn_label = $this->mode ? __( 'Rollback Subscriptions', 'wcpay-subscriptions-migration' ) : __( 'Migrate Subscriptions', 'wcpay-subscriptions-migration' );
					$html     .= "<form action='$action' method='post'>
					  <input type='hidden' name='wcpsm_data' value='$json_data'>
					  <input type='hidden' name='wcpsm_mode' value='$mode'>
					  <div class='wcpsm-clear-top'><input type='submit' class='button-primary' value='$btn_label' name='submit'></div>
					</form>";
				} else {
					$html .= '<p>' . __( '0 associated subscriptions were found.', 'wcpay-subscriptions-migration' ) . '</p>';
				}
			}

			$html .= '</div>';
			$html .= '</div>';

			echo $html;
		}

		public function get_page_1() {

			$action = menu_page_url( 'pl-wcpsm-migration', false );
			$html   = '<div class="wcpsm_migrate_page container mt-3" id="wcpsm_migrate_page_1">';
			$html  .= '<div>';
			$html  .= '<h4>' . __( 'Step 1/3 - Upload CSV File', 'wcpay-subscriptions-migration' ) . '</h4>';
			$html  .= '<form action="' . $action . '" method="post" enctype="multipart/form-data">';
			$html  .= '<div class="wcpsm_mode_div"><select name="wcpsm_mode"><option value="">' . __( 'Migrate', 'wcpay-subscriptions-migration' ) . '</option><option value="rollback">' . __( 'Rollback Migration', 'wcpay-subscriptions-migration' ) . '</option></select></div>';
			$html  .= '<input accept=".csv" type="file" name="wcpsm_file" id="wcpsm_file">
			  <div class="wcpsm-clear-top"><input type="submit" class="button-primary" value="' . __( 'Upload File', 'wcpay-subscriptions-migration' ) . '" name="submit"></div>
			</form>';
			$html  .= '</div>';
			$html  .= '</div>';

			echo $html;
		}

		public function get_subscription( $customer_id, $old_id ) {

			$args = array(
				'subscription_status' => array( 'any' ),
				'meta_query'          => array(
					'relation'               => 'AND',
					'subscriptions_per_page' => 1,
					array(
						'key'     => '_stripe_customer_id',
						'value'   => $customer_id,
						'compare' => '=',
					),
					array(
						'key'     => '_stripe_source_id',
						'value'   => $old_id,
						'compare' => '=',
					),
				),
			);

			$subscriptions = wcs_get_subscriptions( $args );
			$subscription  = $subscriptions ? reset( $subscriptions ) : array();
			return $subscription;
		}

		public function get_subscription_status( $customer_id, $old_id ) {

			$status = '';

			$args = array(
				'subscription_status' => array( 'any' ),
				'meta_query'          => array(
					'relation'               => 'AND',
					'subscriptions_per_page' => 1,
					array(
						'key'     => '_stripe_customer_id',
						'value'   => $customer_id,
						'compare' => '=',
					),
					array(
						'key'     => '_stripe_source_id',
						'value'   => $old_id,
						'compare' => '=',
					),
				),
			);

			$subscriptions = wcs_get_subscriptions( $args );
			$subscription  = $subscriptions ? reset( $subscriptions ) : array();

			if ( $subscription ) {
				$subscription_id   = $subscription->get_id();
				$status            = $subscription->get_status();
				$subscription_edit = get_edit_post_link( $subscription_id );

				$status = '<a target="_blank" href="' . $subscription_edit . '">' . __( "Subscription #$subscription_id - $status", 'wcpay-subscriptions-migration' ) . '</a>';
			} else {
				$status = '';
			}

			return $status;
		}

		private function get_customer_id_option() {

			return WC_Payments::get_gateway()->is_in_test_mode()
				? WC_Payments_Customer_Service::WCPAY_TEST_CUSTOMER_ID_OPTION
				: WC_Payments_Customer_Service::WCPAY_LIVE_CUSTOMER_ID_OPTION;
		}

		public function rollback_subscription( $subscription, $old_id, $new_id, $customer_id ) {
			$result = false;

			try {

				$stripe_id           = 'stripe';
				$old_stripe_customer = $subscription->get_meta( '_old_stripe_customer_id' );
				$tokens              = WC_Payment_Tokens::get_customer_tokens( $subscription->get_customer_id(), 'woocommerce_payments' );
				if ( $old_stripe_customer ) {
					$subscription->update_meta_data( '_stripe_customer_id', $old_stripe_customer );
					$subscription->delete_meta_data( '_old_stripe_customer_id' );
				}

				foreach ( $tokens as $tokn ) {
					if ( $tokn->get_token() == $new_id ) {
						WC_Payment_Tokens::delete( $tokn->get_token() );
					}
				}

				$subscription->set_payment_method( $stripe_id );
				$subscription->save();

				$result = true;
			} catch ( Exception $e ) {
			}

			return $result;
		}

		public function migrate_subscription( $subscription, $old_token, $new_token, $customer_id, $change_customer ) {

			$result = false;
			try {

				$wcpayments_id = 'woocommerce_payments';
				$tokens        = WC_Payment_Tokens::get_customer_tokens( $subscription->get_customer_id(), 'stripe' );

				if ( $tokens ) {
					$token = array();
					foreach ( $tokens as $tokn ) {
						if ( $tokn->get_token() == $old_token ) {
							$token = $tokn;
						}
					}
					if ( $token ) {

						if ( $change_customer ) {
							$old_stripe_customer = $subscription->get_meta( '_stripe_customer_id' );
							$subscription->update_meta_data( '_old_stripe_customer_id', $old_stripe_customer );
							$subscription->update_meta_data( '_stripe_customer_id', $customer_id );
						}

						$new_token_obj = new WC_Payment_Token_CC();
						$new_token_obj->set_gateway_id( WCPay\Payment_Methods\CC_Payment_Gateway::GATEWAY_ID );
						$new_token_obj->set_expiry_month( $token->get_expiry_month() );
						$new_token_obj->set_expiry_year( $token->get_expiry_year() );
						$new_token_obj->set_card_type( $token->get_card_type() );
						$new_token_obj->set_last4( $token->get_last4() );
						$new_token_obj->set_token( $new_token );
						$new_token_obj->set_user_id( $subscription->get_customer_id() );
						$new_token_obj->save();

						$subscription->add_payment_token( $new_token_obj );
						$subscription->set_payment_method( $wcpayments_id );
						$subscription->save();

						$global = WC_Payments::is_network_saved_cards_enabled();
						update_user_option( $subscription->get_customer_id(), $this->get_customer_id_option(), $customer_id, $global );

						$result = true;
					}
				}

				$result = true;
			} catch ( Exception $e ) {
			}

			return $result;
		}

		public function get_data_file() {

			if ( isset( $_POST['wcpsm_mode'] ) ) {
				$this->mode = $_POST['wcpsm_mode'];
			}

			if ( isset( $_FILES['wcpsm_file'] ) ) {

				$this->file = true;
				if ( isset( $_FILES['wcpsm_file']['error'] ) && $_FILES['wcpsm_file']['error'] ) {
					$this->error = __( 'Error uploading file.', 'wcpay-subscriptions-migration' );
				} else {

					$file = $_FILES['wcpsm_file']['tmp_name'];
					$row  = 0;
					if ( ( $handle = fopen( $file, 'r' ) ) !== false ) {
						while ( ( $data = fgetcsv( $handle, 1000, ',' ) ) !== false ) {

							if ( $row ) {
								$customer_id  = isset( $data[0] ) ? $data[0] : '';
								$old_id       = isset( $data[2] ) ? $data[2] : '';
								$new_id       = isset( $data[1] ) ? $data[1] : '';
								$old_customer = isset( $data[3] ) ? $data[3] : '';
								if ( $customer_id && $old_id && $new_id ) {
									$this->data[] = array(
										'customer_id'     => $customer_id,
										'old_id'          => $old_id,
										'new_id'          => $new_id,
										'old_customer_id' => $old_customer,
									);
								}
							}
							++$row;
						}

						fclose( $handle );
					}
				}
			} elseif ( isset( $_POST['wcpsm_data'] ) ) {

				$raw_data = str_replace( '\\', '', $_POST['wcpsm_data'] );
				$data     = json_decode( $raw_data, true );
				if ( $data ) {
					$this->data = $data;
				}
			}
		}
	}
}
