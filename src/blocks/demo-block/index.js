/**
 * Demo blocl
 * Block to display a demo message.
 */

/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import block from './block.json';
import './style.scss';

/**
 * Register block
 */
registerBlockType(block, {
	edit,
	save,
});
