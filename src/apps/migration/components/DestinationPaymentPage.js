import React, { useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

const DestinationPaymentPage = ({ destinationPayments, setDestinationPayments, selectedDestinationPayment, setSelectedDestinationPayment, goToNextStep, goToPreviousStep, isLoading, setIsLoading }) => {
    useEffect(() => {
        setIsLoading(true);
        apiFetch({ 
            path: wcpsm_migration_data.endpoints?.get_destination_methods,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            }
        })
        .then((response) => setDestinationPayments(response.data))
        .catch((error) => console.error('Error fetching destination payments:', error))
        .finally(() => setIsLoading(false));
    }, []);

    return (
        <div>
            <h2>Select Destination Payment Method</h2>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    {destinationPayments.length > 0 ? (
                        destinationPayments.map((payment, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    value={payment.id}
                                    checked={selectedDestinationPayment === payment.id}
                                    onChange={() => setSelectedDestinationPayment(payment.id)}
                                />
                                {payment.name}
                            </label>
                        ))
                    ) : (
                        <p>No available destination payment methods</p>
                    )}
                    <button onClick={goToPreviousStep}>Previous</button>
                    <button onClick={goToNextStep} disabled={!selectedDestinationPayment}>Next</button>
                </>
            )}
        </div>
    );
};

export default DestinationPaymentPage;