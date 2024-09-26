import React, { useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, RadioControl, Button } from '@wordpress/components';

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
                        <RadioControl
                            label="Available Destination Payment Methods"
                            selected={selectedDestinationPayment}
                            options={destinationPayments.map((payment) => ({
                                label: payment.name,
                                value: payment.id
                            }))}
                            onChange={(value) => setSelectedDestinationPayment(value)}
                        />
                    ) : (
                        <p>No available destination payment methods</p>
                    )}
                    <Button className="button button-secondary" onClick={goToPreviousStep}>Previous</Button>
                    <Button className="button button-primary" onClick={goToNextStep} disabled={!selectedDestinationPayment}>Next</Button>
                </>
            )}
        </div>
    );
};

export default DestinationPaymentPage;
