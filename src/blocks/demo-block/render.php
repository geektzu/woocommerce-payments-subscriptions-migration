<?php
/**
 * Block render.
 *
 * We have access to these variables here:
 * - $block: The block name.
 * - $attributes: An array with the block attributes.
 * - $content: The block inner HTML content.
 *
 * @package SDScaffoldPlugin
 */

// Output the block markup.

echo wp_kses_post( $content );
