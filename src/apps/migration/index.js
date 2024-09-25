import { createRoot } from '@wordpress/element';
import Migration from './migration';

const root = createRoot(document.getElementById('migration-root'));
if (root) {
	root.render(<Migration />);
}
