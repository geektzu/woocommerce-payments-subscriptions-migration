// SubscriptionTokensPage.js
import { useState } from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const SubscriptionTokensPage = ({ goToNextStep, goToPreviousStep, setIsLoading }) => {
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
				path: window.wcpsm_migration_data.endpoints?.validate_subscription_tokens,
				method: 'POST',
				headers: {
					'X-WP-Nonce': window.wcpsm_migration_data.nonce,
				},
				body: formData,
			})
				.then((response) => {
					if (response.result) {
						setSuccessMessage('File validated successfully. You can proceed.');
						setPreviewData(response.data);
						setIsFileValid(true);
					} else {
						setErrorMessage('Validation failed: ' + response.message);
						setIsFileValid(false);
					}
				})
				.catch(() => {
					setErrorMessage('Error validating the file. Please try again.');
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
				Please upload a CSV file containing your subscription tokens.
			</p>
			<input type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />

			{successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
			{errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

			{/* Display the preview table if data is available */}
			{previewData.length > 0 && (
				<div className="wpsm-migration-page__table">
					<table>
						<thead>
							<tr>
								{Object.keys(previewData[0]).map((header, index) => (
									<th key={index}>{header}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{previewData.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{Object.values(row).map((value, colIndex) => (
										<td key={colIndex}>{value}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="wpsm-migration-page__actions">
				<Button variant="secondary" onClick={goToPreviousStep} disabled={isUploading}>
					Previous
				</Button>
				<Button variant="primary" onClick={goToNextStep} disabled={!isFileValid}>
					Next
				</Button>
			</div>
		</div>
	);
};

export default SubscriptionTokensPage;
