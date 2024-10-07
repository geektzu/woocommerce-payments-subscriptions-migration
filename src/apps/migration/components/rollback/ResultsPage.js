import { useState } from '@wordpress/element';

const ResultsPage = ({ migrationResults }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const perPage = window.wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

	const startIndex = (currentPage - 1) * perPage;
	const currentResults = migrationResults.slice(
		startIndex,
		startIndex + perPage
	);

	const totalRollbacksOnGreen = migrationResults.filter(
		(result) => result.success
	).length;

	return (
		<div className="wpsm-migration-page">
			<h2>Rollback Results</h2>
			<p className="text-muted">
				The rollback process has completed. These are the results of the
				rollback process.
			</p>
			{migrationResults.length > 0 ? (
				<>
					<div className="wpsm-migration-page__checkbox_list">
						{currentResults.map((result, index) => {
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
					<hr />
					<p className="text-footer">
						Total successful rollbacks: {totalRollbacksOnGreen}
					</p>
				</>
			) : (
				<p>No rollback results available.</p>
			)}
		</div>
	);
};

export default ResultsPage;
