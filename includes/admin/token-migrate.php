<?php
/**
 * Abstract payment tokens
 *
 * Generic payment tokens functionality which can be extended by individual types of payment tokens.
 *
 * @class WC_Payment_Token
 * @package WooCommerce\Abstracts
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WooCommerce Payment Token.
 *
 * Representation of a general payment token to be extended by individuals types of tokens
 * examples: Credit Card, eCheck.
 *
 * @class       WC_Payment_Token
 * @version     3.0.0
 * @since       2.6.0
 * @package     WooCommerce\Abstracts
 */
class WC_Payment_Token_Migrate extends WC_Payment_Token {
	
	protected $type = 'migrate';

	public function __construct( $token = '' ) {
		parent::__construct( $token );
	}
}