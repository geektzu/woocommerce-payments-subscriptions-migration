import React from 'react';

const ResultsPage = ({ migrationResults }) => {
    return (
        <div>
            <h2>Migration Results</h2>
            {migrationResults.length > 0 ? (
                migrationResults.map((result, index) => (
                    <p 
                        key={index} 
                        style={{ color: result.success ? 'green' : 'red' }}
                    >
                        {`${result.name} - ${result.message}`}
                    </p>
                ))
            ) : (
                <p>No results available.</p>
            )}
        </div>
    );
};

export default ResultsPage;