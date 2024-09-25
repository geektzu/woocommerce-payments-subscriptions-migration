/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';

/**
 * Edit component.
 * See https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/#edit
 */
const Edit = (props) => {
	const { attributes, setAttributes } = props;
	const { isDemo } = attributes;

	const blockProps = useBlockProps();

	return (
		<div {...blockProps}>
			<InspectorControls key="setting">
				<PanelBody title="General">
					<div>
						<ToggleControl
							label="Is Demo"
							help={isDemo ? 'Yes.' : 'No.'}
							checked={isDemo}
							onChange={(isDemo) => setAttributes({ isDemo })}
						/>
					</div>
				</PanelBody>
			</InspectorControls>
			<p>{__('Demo edit side.', 'sd-scaffold-plugin')}</p>
		</div>
	);
};
export default Edit;
