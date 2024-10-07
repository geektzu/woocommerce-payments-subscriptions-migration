import { useState } from '@wordpress/element';
import { Button, Icon } from '@wordpress/components'; // Import Button and Icon components
import Migration from './components/migration/Migration';
import Rollback from './components/rollback/Rollback';
import './migration.scss';

const MigrationBase = () => {
	const [selectedOption, setSelectedOption] = useState(null);

	const handleSelection = (option) => {
		setSelectedOption(option);
	};

	const goBackToBase = () => {
		setSelectedOption(null);
	};

	return (
		<div className="wpsm-migration-wrapper">
			{!selectedOption && (
				<div className="migration-selection">
					<h2>Select an Option</h2>
					<Button
						variant="primary"
						onClick={() => handleSelection('migration')}
						icon={<Icon icon="update" />} // Icon for Start Migration
					>
						Start Migration
					</Button>
					<span>&nbsp;</span>
					<Button
						variant="secondary"
						onClick={() => handleSelection('rollback')}
						icon={<Icon icon="undo" />} // Icon for Rollback Migration
					>
						Rollback Migration
					</Button>
				</div>
			)}

			{selectedOption === 'migration' && (
				<Migration goBackToBase={goBackToBase} />
			)}

			{selectedOption === 'rollback' && (
				<Rollback goBackToBase={goBackToBase} />
			)}
		</div>
	);
};

export default MigrationBase;
