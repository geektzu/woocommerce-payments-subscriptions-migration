import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import './migration.scss';

const Step1 = ({ originPayments, selectedOriginPayment, setSelectedOriginPayment, goToNextStep }) => {
    return (
        <div>
            <h2>Select Origin Payment Method</h2>
            {originPayments.length > 0 ? originPayments.map((payment, index) => (
                <label key={index}>
                    <input
                        type="radio"
                        value={payment.id}
                        checked={selectedOriginPayment === payment.id}
                        onChange={() => setSelectedOriginPayment(payment.id)}
                    />
                    {payment.name}
                </label>
            )) : <p>Loading payment methods...</p>}
            <button onClick={goToNextStep} disabled={!selectedOriginPayment}>Next</button>
        </div>
    );
};

const Step2 = ({ selectedOriginPayment, subscriptions, setSubscriptions, selectedSubscriptions, setSelectedSubscriptions, goToNextStep, goToPreviousStep }) => {
    useEffect(() => {
	    apiFetch({ 
		    	path: wcpsm_migration_data.endpoints?.get_subscriptions,
	            headers: {
					'X-WP-Nonce': wcpsm_migration_data.nonce,
				} 
			})
	        .then((response) => setSubscriptions(response.data))
	        .catch((error) => console.error('Error fetching subscriptions:', error));
	}, [selectedOriginPayment]);

    const handleSelectAll = () => {
        if (selectedSubscriptions.length === subscriptions.length) {
            setSelectedSubscriptions([]);
        } else {
            setSelectedSubscriptions(subscriptions.map(sub => sub.id));
        }
    };

    const handleCheckboxChange = (subscriptionId) => {
        if (selectedSubscriptions.includes(subscriptionId)) {
            setSelectedSubscriptions(selectedSubscriptions.filter(id => id !== subscriptionId));
        } else {
            setSelectedSubscriptions([...selectedSubscriptions, subscriptionId]);
        }
    };

    return (
        <div>
            <h2>Select Subscriptions</h2>
            <label>
                <input
                    type="checkbox"
                    checked={selectedSubscriptions.length === subscriptions.length}
                    onChange={handleSelectAll}
                />
                Select All
            </label>
            {subscriptions.map(subscription => (
                <label key={subscription.id}>
                    <input
                        type="checkbox"
                        checked={selectedSubscriptions.includes(subscription.id)}
                        onChange={() => handleCheckboxChange(subscription.id)}
                    />
                    {subscription.name}
                </label>
            ))}
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={goToNextStep} disabled={selectedSubscriptions.length === 0}>Next</button>
        </div>
    );
};

const Step3 = ({ destinationPayments, setDestinationPayments, selectedDestinationPayment, setSelectedDestinationPayment, goToNextStep, goToPreviousStep }) => {
    useEffect(() => {
	    apiFetch({ 
		    	path: wcpsm_migration_data.endpoints?.get_destination_methods,
	            headers: {
					'X-WP-Nonce': wcpsm_migration_data.nonce,
				} })
	        .then((response) => setDestinationPayments(response.data))
	        .catch((error) => console.error('Error fetching destination payments:', error));
	}, []);

    return (
        <div>
            <h2>Select Destination Payment Method</h2>
            {destinationPayments.length > 0 ? destinationPayments.map((payment, index) => (
                <label key={index}>
                    <input
                        type="radio"
                        value={payment.id}
                        checked={selectedDestinationPayment === payment.id}
                        onChange={() => setSelectedDestinationPayment(payment.id)}
                    />
                    {payment.name}
                </label>
            )) : <p>Loading payment methods...</p>}
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={goToNextStep} disabled={!selectedDestinationPayment}>Next</button>
        </div>
    );
};

const Step4 = ({ selectedSubscriptions, selectedOriginPayment, selectedDestinationPayment, testResults, setTestResults, goToNextStep, goToPreviousStep, setMigrationResults }) => {
    const handleTest = () => {
	    apiFetch({
	        path: wcpsm_migration_data.endpoints?.dry_migrate,
            headers: {
				'X-WP-Nonce': wcpsm_migration_data.nonce,
			},
	        method: 'POST',
	        data: {
	            selectedSubscriptions,
	            selectedOriginPayment,
	            selectedDestinationPayment,
	        },
	    })
	    .then((response) => setTestResults(response.data))
	    .catch((error) => console.error('Error running test:', error));
	};

    const handleRun = () => {
	    apiFetch({
	        path: wcpsm_migration_data.endpoints?.migrate,
            headers: {
				'X-WP-Nonce': wcpsm_migration_data.nonce,
			},
	        method: 'POST',
	        data: {
	            selectedSubscriptions,
	            selectedOriginPayment,
	            selectedDestinationPayment,
	        },
	    })
	    .then((response) => {
	        setMigrationResults(response.data);
	        goToNextStep();
	    })
	    .catch((error) => console.error('Error running migration:', error));
	};

    return (
        <div>
            <h2>Test Migration</h2>
            <button onClick={handleTest}>Test</button>
            <div>
                {testResults.map((result, index) => (
                    <p key={index} style={{ color: result.success ? 'green' : 'red' }}>
                        {result.subscription}: {result.message}
                    </p>
                ))}
            </div>
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={handleRun} disabled={testResults.filter(res => res.success).length === 0}>Run Migration</button>
        </div>
    );
};

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

const Migration = () => {
    const [step, setStep] = useState(1);
    const [originPayments, setOriginPayments] = useState([]);
    const [selectedOriginPayment, setSelectedOriginPayment] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
    const [destinationPayments, setDestinationPayments] = useState([]);
    const [selectedDestinationPayment, setSelectedDestinationPayment] = useState(null);
    const [testResults, setTestResults] = useState([]);
    const [migrationResults, setMigrationResults] = useState([]);
    
    console.log( wcpsm_migration_data );
    
    useEffect(() => {
        if (step === 1) {
            // Fetch origin payment methods
            apiFetch({ 
	            path: wcpsm_migration_data.endpoints?.get_origin_methods,
	            headers: {
					'X-WP-Nonce': wcpsm_migration_data.nonce,
				},
	        } )
            	.then( (response) => {
	            	setOriginPayments(response.data)
	            } )
				.catch((error) => console.error('Error fetching origin payments:', error));
        }
    }, [step]);

    const goToNextStep = () => {
        setStep(step + 1);
    };

    const goToPreviousStep = () => {
        setStep(step - 1);
    };

    return (
        <div>
            {step === 1 && (
                <Step1 
                    originPayments={originPayments}
                    selectedOriginPayment={selectedOriginPayment}
                    setSelectedOriginPayment={setSelectedOriginPayment}
                    goToNextStep={goToNextStep}
                />
            )}
            {step === 2 && (
                <Step2 
                    selectedOriginPayment={selectedOriginPayment}
                    subscriptions={subscriptions}
                    setSubscriptions={setSubscriptions}
                    selectedSubscriptions={selectedSubscriptions}
                    setSelectedSubscriptions={setSelectedSubscriptions}
                    goToNextStep={goToNextStep}
                    goToPreviousStep={goToPreviousStep}
                />
            )}
            {step === 3 && (
                <Step3 
                    destinationPayments={destinationPayments}
                    setDestinationPayments={setDestinationPayments}
                    selectedDestinationPayment={selectedDestinationPayment}
                    setSelectedDestinationPayment={setSelectedDestinationPayment}
                    goToNextStep={goToNextStep}
                    goToPreviousStep={goToPreviousStep}
                />
            )}
            {step === 4 && (
                <Step4 
                    selectedSubscriptions={selectedSubscriptions}
                    selectedOriginPayment={selectedOriginPayment}
                    selectedDestinationPayment={selectedDestinationPayment}
                    testResults={testResults}
                    setTestResults={setTestResults}
                    goToNextStep={goToNextStep}
                    goToPreviousStep={goToPreviousStep}
                    setMigrationResults={setMigrationResults}
                />
            )}
            {step === 5 && (
                <ResultsPage 
                    migrationResults={migrationResults}
                />
            )}
        </div>
    );
};
export default Migration;