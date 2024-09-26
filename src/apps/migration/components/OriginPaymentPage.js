import React from 'react';
import { Spinner, RadioControl, Button } from '@wordpress/components';

const OriginPaymentPage = ({ originPayments, selectedOriginPayment, setSelectedOriginPayment, goToNextStep, isLoading }) => {
    return (
        <div>
            <h2>Select Origin Payment Method</h2>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    {originPayments.length > 0 ? (
                        <RadioControl
                            label="Available Origin Payment Methods"
                            selected={selectedOriginPayment}
                            options={originPayments.map((payment) => ({
                                label: payment.name,
                                value: payment.id
                            }))}
                            onChange={(value) => setSelectedOriginPayment(value)}
                        />
                    ) : (
                        <p>No available origin payment methods</p>
                    )}
                    <Button className="button button-primary" onClick={goToNextStep} disabled={!selectedOriginPayment}>
                        Next
                    </Button>
                </>
            )}
        </div>
    );
};

export default OriginPaymentPage;
