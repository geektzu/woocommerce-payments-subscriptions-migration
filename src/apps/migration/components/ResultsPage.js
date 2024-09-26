import React, { useState } from 'react';
import { Button } from '@wordpress/components';

const ResultsPage = ({ migrationResults }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

    // Calculate results to display on the current page
    const startIndex = (currentPage - 1) * perPage;
    const currentResults = migrationResults.slice(startIndex, startIndex + perPage);

    // Handle pagination
    const totalPages = Math.ceil(migrationResults.length / perPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div>
            <h2>Migration Results</h2>
            {migrationResults.length > 0 ? (
                <>
                    {currentResults.map((result, index) => (
                        <p 
                            key={index} 
                            style={{ color: result.success ? 'green' : 'red' }}
                        >
                            {`${result.name} - ${result.message}`}
                        </p>
                    ))}
                    {/* Pagination controls */}
                    <div className="pagination-controls">
                        <Button 
                            isSecondary 
                            onClick={goToPreviousPage} 
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <Button 
                            isSecondary 
                            onClick={goToNextPage} 
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </>
            ) : (
                <p>No results available.</p>
            )}
        </div>
    );
};

export default ResultsPage;