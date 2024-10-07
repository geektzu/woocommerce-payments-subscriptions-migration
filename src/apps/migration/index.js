/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies - The actual React app.
 */
import MigrationBase from './MigrationBase';

const root = createRoot(document.getElementById('migration-root'));
if (root) {
	root.render(<MigrationBase />);
}
