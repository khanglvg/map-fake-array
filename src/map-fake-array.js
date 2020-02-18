import UniqId from './unique-identifier';
import * as Log from './utils/logger';
import isNum from './utils/isNumber';
import * as Constant from './utils/constant';

const LOG_PREFIX = '[MapFakeArray]';
const ID_PREFIX = 'IdGen_';
const InnerError = {
	LESS_THAN_ZERO: 'less than zero',
	GREATER_THAN_SIZE: 'greater than size',
	NaN: 'Not a number',
};

function MFArray({key} = {}) {
	/* ========================================================================
	 Inner variables declaration
	 ======================================================================== */
	let __collection__ = new Map();
	let __indices__ = new Map();

	let _usingKey = false;
	let _key;
	let _localId;

	if (key) {
		_usingKey = true;
		_key = key;
	}
	else {
		_localId = new UniqId(0);
	}

	return {
		// region ===== Get =====
		length,
		toArray,
		JSONStringify,
		findById,
		findByIndex,
		getIndexOf,
		has,
		// endregion

		// region ===== Modify =====
		add,
		addMulti,
		updateAt,
		updateById,
		deleteAt,
		deleteById,
		deleteLast,
		push,
		unshift,
		// endregion
	};

	/* ================================================================
	 [Public API] - GET
	 =============================================================== */
	function length() {
		return __indices__.size;
	}

	function toArray() {
		let res = [];
		for (const [_, key] of __indices__) {
			const element = __collection__.get(key);
			res.push(element.value);
		}
		return res;
	}

	/**
	 * @return {string}
	 */
	function JSONStringify() {
		let obj = Array.from(__collection__).reduce((obj, [key, value]) => {
			obj[key] = value;
			return obj;
		}, {});
		return JSON.stringify(obj);
	}

	function findById(id) {
		if (id == null) {
			Log.logError(LOG_PREFIX, `Cannot get value of ${id}!`);
			return Constant.NOT_FOUND;
		}

		const element = __collection__.get(id);
		if (element == null) {
			Log.logError(LOG_PREFIX, `Cannot get value of ${id}!`);
			return Constant.NOT_FOUND;
		}

		return element.value;
	}

	function findByIndex(index) {
		const checker = _checkIndex(index);
		if (!checker.isValid) {
			return _notifyErrorAndReturn(checker);
		}

		const id = __indices__.get(index);
		if (id == null) {
			Log.logError(LOG_PREFIX, `Cannot get element at ${index}!`);
			return Constant.NOT_FOUND;
		}

		return findById(id);
	}

	function getIndexOf(key) {
		const element = __collection__.get(key);
		if (element && element.index != null) {
			return element.index;
		}
		return Constant.NOT_FOUND;
	}

	function has(key) {
		return __collection__.has(key);
	}

	/* ================================================================
	 [Public API] - MODIFY
	 =============================================================== */
	function push(...elements) {
		let size = length();
		if (elements.constructor !== Array) { return false; }
		if (elements.length === 1 && elements[0].constructor === Array) {
			elements = elements[0];
		}

		const backup = _getBackup();
		for (let i = 0; i < elements.length; i++) {
			let r = _set(size, elements[i]);
			if (!r) {
				__collection__ = backup.collection;
				__indices__ = backup.indices;
				Log.logError(LOG_PREFIX, 'Push element(s) has failed!');
				return;
			}
			size++;
		}
	}

	function unshift(...elements) {
		if (elements.constructor !== Array) { return false; }
		if (elements.length === 1 && elements[0].constructor === Array) {
			elements = elements[0];
		}

		if (elements.length === 1) {
			_makeBlank(0, 1);
			return _set(0, elements[0]);
		}
		else {
			const backup = _getBackup();
			_makeBlank(0, elements.length);
			for (let i = 0; i < elements.length; i++) {
				let r = _set(i, elements[i]);
				if (!r) {
					__collection__ = backup.collection;
					__indices__ = backup.indices;
					Log.logError(LOG_PREFIX, 'Push element(s) has failed!');
					return;
				}
			}
		}
	}

	function add(index, element) {
		if (
		  !isNum(index) ||
		  index > __indices__.size ||
		  index < 0 ||
		  element == null
		) {
			Log.logError(LOG_PREFIX, 'Add failed!');
			return false;
		}

		const backup = _getBackup();
		_makeBlank(index, index + 1);
		const r = _set(index, element, false);
		if (!r) {
			__collection__ = backup.collection;
			__indices__ = backup.indices;
		}
		return true;
	}

	function addMulti(index, elements) {
		if (
		  !isNum(index) ||
		  index > __indices__.size ||
		  index < 0 ||
		  elements == null
		) {
			Log.logError(LOG_PREFIX, 'Add multi failed!');
			return false;
		}

		const backup = _getBackup();
		_makeBlank(index, index + elements.length);
		for (let i = 0; i < elements.length; i++) {
			const r = _set(index + i, elements[i], false);
			if (!r) {
				__collection__ = backup.collection;
				__indices__ = backup.indices;
				Log.logError(LOG_PREFIX, 'Add multi failed!');
				return false;
			}
		}
		return true;
	}

	function updateAt(index, value) {
		return _set(index, value);
	}

	function updateById(id, value) {
		const idx = getIndexOf(id);
		if (idx === Constant.NOT_FOUND) {
			Log.logError(LOG_PREFIX, `Cannot get ${id}`);
			return false;
		}
		return _set(idx, value);
	}

	function deleteAt(index) {
		const checker = _checkIndex(index);
		if (!checker.isValid) {
			Log.logError(LOG_PREFIX, 'Index has invalid!');
			return _notifyErrorAndReturn(checker, false);
		}

		const size = length();
		if (index === size - 1) {
			deleteLast();
		}
		else {
			let nextIndex,
			  currentId,
			  delId = __indices__.get(index);
			if (delId == null) { return false; }
			for (let i = index; i < size - 1; i++) {
				nextIndex = i + 1;
				currentId = __indices__.get(nextIndex);
				_updateIndex(currentId, i);
			}
			__indices__.delete(size - 1);
			__collection__.delete(delId);
		}
		return true;
	}

	function deleteById(id) {
		const idx = getIndexOf(id);
		if (idx === Constant.NOT_FOUND) { return false; }
		return deleteAt(idx);
	}

	function deleteLast() {
		const size = length();
		const key = __indices__.get(size - 1);
		__indices__.delete(size - 1);
		__collection__.delete(key);
		return true;
	}

	/* ================================================================
	 [Inner] - UTILS
	 =============================================================== */
	function _set(index, element, needCheckIndex = true) {
		if (needCheckIndex) {
			const checker = _checkIndex(index);
			if (!checker.isValid) {
				Log.logError(LOG_PREFIX, 'Set the element has failed!');
				return _notifyErrorAndReturn(checker, false);
			}
		}

		if (element == null) {
			Log.logError(LOG_PREFIX, 'Set the element has failed!', 'Element is undefined of null');
			return false;
		}

		if (_usingKey) {
			const elType = typeof element;
			if (elType !== 'object') {
				Log.logError(LOG_PREFIX, 'Set the element has failed!', 'Element has not the key');
				return false;
			}
			const id = element[`${_key}`];
			__indices__.set(index, id);
			__collection__.set(id, {
				index: index,
				value: element,
			});
		}
		else {
			const id = ID_PREFIX + _localId.next();
			__indices__.set(index, id);
			__collection__.set(id, {
				index: index,
				value: element,
			});
		}

		return true;
	}

	function _makeBlank(fromIndex, toIndex) {
		const size = length();
		if (size === 0) { return true;}

		const dif = toIndex - fromIndex;
		const max = size - 1 + dif;
		// Shift elements
		for (let i = max; i >= toIndex; i--) {
			const id = __indices__.get(i - dif);
			const element = __collection__.get(id);
			if (element == null) {
				return false;
			}
			const elValue = element.value;
			_set(i, elValue, false);
		}
		// Create blank
		for (let i = fromIndex; i < toIndex; i++) {
			__indices__.set(i, undefined);
		}
	}

	function _checkIndex(index) {
		let r = {
			isValid: true,
			errorCode: '',
		};

		if (!isNum(index)) {
			r.isValid = false;
			r.errorCode = InnerError.NaN;
		}
		else if (index > __indices__.size) {
			r.isValid = false;
			r.errorCode = InnerError.GREATER_THAN_SIZE;
		}
		else if (index < 0) {
			r.isValid = false;
			r.errorCode = InnerError.LESS_THAN_ZERO;
		}
		return r;
	}

	function _notifyErrorAndReturn(checker, returnValue = Constant.NOT_FOUND) {
		switch (checker.errorCode) {
			case InnerError.NaN: {
				Log.logError(LOG_PREFIX, 'Expected index is a number!');
				return returnValue;
			}
			case InnerError.GREATER_THAN_SIZE: {
				Log.logError(LOG_PREFIX, 'Index cannot be greater than array length!');
				return returnValue;
			}
			case InnerError.LESS_THAN_ZERO: {
				Log.logError(LOG_PREFIX, 'Index cannot be less than 0!');
				return returnValue;
			}
			default : {
				Log.logError(LOG_PREFIX, 'Undefined error!');
				return returnValue;
			}
		}
	}

	function _getBackup() {
		return {
			collection: new Map(__collection__),
			indices: new Map(__indices__),
		};
	}

	function _updateIndex(id, newIndex) {
		const oldValue = __collection__.get(id);
		if (!oldValue || oldValue.index == null) { return false;}

		__indices__.set(newIndex, id);
		__collection__.set(id, {
			index: newIndex,
			value: oldValue.value,
		});
	}
}

export default MFArray;