/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies - The actual React app.
 */
import Migration from './migration';

const root = createRoot(document.getElementById('migration-root'));
if (root) {
	root.render(<Migration />);
}
