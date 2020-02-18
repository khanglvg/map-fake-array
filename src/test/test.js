import React from 'react';
import MFArray from '../map-fake-array';

export default class Test extends React.Component {
	constructor(props) {
		super(props);
		this.array = new MFArray({key: 'name'});
		let fData = [
			{
				name: 'khang',
				age: 1,
			},
			{
				name: 'nhat',
				age: 2,
			},
		];
		this.array.push({
			name: 'Sang',
			age: 3,
		});
		this.array.push({
			name: 'Sang1',
			age: 3,
		});
		this.array.push({
			name: 'Sang2',
			age: 3,
		});
		this.array.push({
			name: 'Sang3',
			age: 3,
		});

		this.array.unshift(fData);
	}

	render() {
		console.log(this.array.toArray());
		return (
		  <div>
			  ABC
		  </div>
		);
	}
}