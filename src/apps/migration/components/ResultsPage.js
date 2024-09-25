import React from 'react';

const ResultsPage = ({ migrationResults }) => {
    return (
        <div>
            <h2>Migration Results</h2>
            {migrationResults.map((result, index) => (
                <p key={index} style={{ color: result.success ? 'green' : 'red' }}>
                    {result.subscription}: {result.message}
                </p>
            ))}
        </div>
    );
};

export default ResultsPage;