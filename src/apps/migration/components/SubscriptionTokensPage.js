// SubscriptionTokensPage.js
import { useState } from '@wordpress/element';
import { Button, FormFileUpload } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const SubscriptionTokensPage = ({
	goToNextStep,
	goToPreviousStep,
	setIsLoading,
}) => {
	const [file, setFile] = useState(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [isFileValid, setIsFileValid] = useState(false); // Track file validation status
	const [previewData, setPreviewData] = useState([]); // State for storing the preview data

	const handleFileChange = (event) => {
		const selectedFile = event.target.files[0];
		setFile(selectedFile);
		setErrorMessage('');
		setSuccessMessage('');
		setIsFileValid(false);
		setPreviewData([]); // Clear previous preview data

		if (selectedFile) {
			const formData = new FormData();
			formData.append('file', selectedFile);

			setIsUploading(true);
			setIsLoading(true);

			// API call to validate the CSV file
			apiFetch({
				path: window.wcpsm_migration_data.endpoints
					?.validate_subscription_tokens,
				method: 'POST',
				headers: {
					'X-WP-Nonce': window.wcpsm_migration_data.nonce,
				},
				body: formData,
			})
				.then((response) => {
					if (response.result) {
						setSuccessMessage(
							'File validated successfully. You can proceed.'
						);
						setPreviewData(response.data);
						setIsFileValid(true);
					} else {
						setErrorMessage(
							'Validation failed: ' + response.message
						);
						setIsFileValid(false);
					}
				})
				.catch((error) => {
					console.error('Error validating the file:', error);
					setErrorMessage(
						'Error validating the file. Please try again.'
					);
					setIsFileValid(false);
				})
				.finally(() => {
					setIsUploading(false);
					setIsLoading(false);
				});
		}
	};

	return (
		<div className="wpsm-migration-page">
			<h2>Import Subscription Tokens</h2>
			<p className="text-muted">
				Please upload a CSV file containing your subscription migration
				data provided by Stripe. Note that the file has to have a
				specific header signature for it to be accepted.
			</p>
			<p className="text-muted">
				You can download a sample CSV file{' '}
				<a
					href={window.wcpsm_migration_data?.download_sample_csv}
					download
				>
					here
				</a>
				.
			</p>
			<div className="wpsm-migration-page__csv_upload">
				<FormFileUpload
					variant="secondary"
					type="file"
					accept=".csv"
					onChange={handleFileChange}
					disabled={isUploading}
				>
					Select your CSV file
				</FormFileUpload>
				<div>
					{successMessage && (
						<p className="text-success">{successMessage}</p>
					)}
					{errorMessage && (
						<p className="text-failure">{errorMessage}</p>
					)}
				</div>
			</div>

			{/* Display the preview table if data is available */}
			{previewData.length > 0 && (
				<div className="wpsm-migration-page__table">
					<table>
						<thead>
							<tr>
								{Object.keys(previewData[0]).map(
									(header, index) => (
										<th key={index}>{header}</th>
									)
								)}
							</tr>
						</thead>
						<tbody>
							{previewData.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{Object.values(row).map(
										(value, colIndex) => (
											<td key={colIndex}>{value}</td>
										)
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="wpsm-migration-page__actions">
				<Button
					variant="secondary"
					onClick={goToPreviousStep}
					disabled={isUploading}
				>
					Previous
				</Button>
				<Button
					variant="primary"
					onClick={goToNextStep}
					disabled={!isFileValid}
				>
					Next
				</Button>
			</div>
		</div>
	);
};

export default SubscriptionTokensPage;
