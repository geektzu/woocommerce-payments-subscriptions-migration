/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

const Save = (props) => {
	const blockProps = useBlockProps.save();

	const { attributes } = props;
	const { isDemo } = attributes;

	return (
		<div {...blockProps}>
			<p>{__('Demo frontend side.', 'sd-scaffold-plugin')}</p>
			{isDemo && <p>{__('This is a demo.', 'sd-scaffold-plugin')}</p>}
		</div>
	);
};

export default Save;
