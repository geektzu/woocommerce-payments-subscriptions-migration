/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const ResultsPage = ({ migrationResults }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const perPage = window.wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

	// Calculate results to display on the current page
	const startIndex = (currentPage - 1) * perPage;
	const currentResults = migrationResults.slice(
		startIndex,
		startIndex + perPage
	);

	const totalMigrationsOnGreen = migrationResults.filter(
		(result) => result.success
	).length;

	return (
		<div className="wpsm-migration-page">
			<h2>Migration Results</h2>
			<p className="text-muted">
				The migration has completed. These are the results of the
				migration process.
			</p>
			{migrationResults.length > 0 ? (
				<>
					<div className="wpsm-migration-page__checkbox_list">
						<div className="wpsm-migration-page__checkbox_list_top"></div>
						<div className="wpsm-migration-page__checkbox_list_middle">
							{currentResults.map((result, index) => {
								// Replace &amp; in the permalink with &
								const permalink = result.permalink
									? result.permalink.replace(/&amp;/g, '&')
									: null;

								const resultName = permalink ? (
									<a
										href={permalink}
										target="_blank"
										rel="noopener noreferrer"
									>
										{result.name}
									</a>
								) : (
									result.name
								);

								return (
									<p
										key={index}
										style={{
											color: result.success ? 'green' : 'red',
										}}
									>
										{resultName} - {result.message}
									</p>
								);
							})}
						</div>
						<div className="page__checkbox_list_bottom">
							<hr />
							<p className="text-footer">
								Total migrations processed: {totalMigrationsOnGreen}
							</p>
						</div>
					</div>
					<div className="wpsm-migration-page__actions">&nbsp;</div>
				</>
			) : (
				<p>No results available.</p>
			)}
		</div>
	);
};

export default ResultsPage;