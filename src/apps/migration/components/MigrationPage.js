import React, { useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, Button, ProgressBar } from '@wordpress/components';

const MigrationPage = ({ selectedSubscriptions, selectedOriginPayment, selectedDestinationPayment, testResults, setTestResults, goToNextStep, goToPreviousStep, setMigrationResults, isLoading, setIsLoading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dryRunPage, setDryRunPage] = useState(1); // We'll reuse this state for the live run as well
    const perPage = wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

    const handleTest = async () => {
        setIsProcessing(true);
        setIsLoading(true);

        const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
        setProgress((1 / totalBatches) * 100);
        let allResults = [];

        for (let page = 1; page <= totalBatches; page++) {
            setDryRunPage(page); // Set the current dry run page
            const startIndex = (page - 1) * perPage;
            const subscriptionsBatch = selectedSubscriptions.slice(startIndex, startIndex + perPage);

            try {
                const response = await apiFetch({
                    path: wcpsm_migration_data.endpoints?.dry_migrate,
                    headers: {
                        'X-WP-Nonce': wcpsm_migration_data.nonce,
                    },
                    method: 'POST',
                    data: {
                        subscriptions: subscriptionsBatch,
                        origin_pm: selectedOriginPayment,
                        destination_pm: selectedDestinationPayment,
                    },
                });

                allResults = [...allResults, ...response.data];

                // Update progress
                setProgress(((page + 1) / totalBatches) * 100);
            } catch (error) {
                console.error('Error running test:', error);
            }
        }

        setTestResults(allResults);
        setIsProcessing(false);
        setIsLoading(false);
    };

    const handleRun = async () => {
        setIsProcessing(true);
        setIsLoading(true);

        const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
        setProgress((1 / totalBatches) * 100);
        let allResults = [];

        for (let page = 1; page <= totalBatches; page++) {
            setDryRunPage(page); // Reusing this for live run page indication
            const startIndex = (page - 1) * perPage;
            const subscriptionsBatch = selectedSubscriptions.slice(startIndex, startIndex + perPage);

            try {
                const response = await apiFetch({
                    path: wcpsm_migration_data.endpoints?.migrate,
                    headers: {
                        'X-WP-Nonce': wcpsm_migration_data.nonce,
                    },
                    method: 'POST',
                    data: {
                        subscriptions: subscriptionsBatch,
                        origin_pm: selectedOriginPayment,
                        destination_pm: selectedDestinationPayment,
                    },
                });

                allResults = [...allResults, ...response.data];

                // Update progress
                setProgress(((page + 1) / totalBatches) * 100);
            } catch (error) {
                console.error('Error running live migration:', error);
            }
        }

        setMigrationResults(allResults);
        setIsProcessing(false);
        setIsLoading(false);
        goToNextStep();
    };

    // Calculate subscriptions to display on the current page
    const startIndex = (currentPage - 1) * perPage;
    const currentSubscriptions = selectedSubscriptions.slice(startIndex, startIndex + perPage);

    // Handle pagination
    const totalPages = Math.ceil(selectedSubscriptions.length / perPage);

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
            <h2>Test Migration</h2>

            <div>
                {selectedSubscriptions.length > 0 ? (
                    <>
                        {currentSubscriptions.map((subscription, index) => {
                            const result = testResults.find(res => res.id === subscription.id);
                            const statusText = result ? result.message : "Pending test";
                            const statusColor = result ? (result.success ? 'green' : 'red') : 'gray';
                            const subscriptionName = result ? result.name : subscription.name;

                            return (
                                <p 
                                    key={index} 
                                    style={{ 
                                        color: statusColor, 
                                        opacity: result ? 1 : 0.5 // Grayed out if not tested yet
                                    }}
                                >
                                    {`${subscriptionName} - ${statusText}`}
                                </p>
                            );
                        })}
                        {/* Pagination controls */}
                        <div className="pagination-controls">
                            <Button 
                                isSecondary 
                                onClick={goToPreviousPage} 
                                disabled={currentPage === 1 || isProcessing}
                            >
                                Previous
                            </Button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <Button 
                                isSecondary 
                                onClick={goToNextPage} 
                                disabled={currentPage === totalPages || isProcessing}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                ) : (
                    <p>No subscriptions selected for migration</p>
                )}
            </div>

            {/* Display Progress Bar if processing */}
            {isProcessing && (
                <>
                    <p>{`Page ${dryRunPage} of ${Math.ceil(selectedSubscriptions.length / perPage)}`}</p>
                    <ProgressBar value={progress} />
                </>
            )}

            {/* Buttons aligned together below the list */}
            <div className="button-group" style={{ marginTop: '20px' }}>
                <Button 
                    className="button button-secondary" 
                    onClick={goToPreviousStep} 
                    disabled={isProcessing}
                >
                    Previous
                </Button>
                <Button 
                    className="button button-tertiary" 
                    onClick={handleTest} 
                    disabled={isLoading || isProcessing}
                >
                    {isLoading ? <Spinner /> : 'Test'}
                </Button>
                <Button 
                    className="button button-primary" 
                    onClick={handleRun} 
                    disabled={testResults.filter(res => res.success).length === 0 || isLoading || isProcessing}
                >
                    {isLoading ? <Spinner /> : 'Run Migration'}
                </Button>
            </div>
        </div>
    );
};

export default MigrationPage;