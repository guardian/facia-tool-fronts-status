/* globals moment */
!function () {

var $ = function () {
    return Array.prototype.slice.call(document.querySelectorAll.apply(document, arguments));
};
var appliedFilters = {};
var filters = {
    // Filters return true to hide the value
    text: function (column, include) {
        appliedFilters[column] = function (cell) {
            var textValue = cell.textContent.trim();

            return include.indexOf(textValue) === -1;
        };
    },
    value: function (column, bound) {
        appliedFilters[column] = function (cell) {
            var cellValue = parseNumber(cell.getAttribute('sorttable_customkey') || cell.textContent.trim());

            return (bound.min != null && cellValue < bound.min) ||
                    (bound.max != null && cellValue > bound.max);
        };
    },
    date: function (column, bound) {
        appliedFilters[column] = function (cell) {
            var min = bound.min ? moment()
                .subtract(bound.min.number, bound.min.unit) : null;
            var max = bound.max ? moment()
                .subtract(bound.max.number, bound.max.unit) : null;
            var cellValue = parseNumber(cell.getAttribute('sorttable_customkey') || cell.textContent.trim());

            if (!cellValue) {
                // never edited
                return !!max;
            } else {
                var value = moment(cellValue * 1000);
                if (min && min.isBefore(value, bound.min.unit)) {
                    return true;
                }
                if (max && max.isAfter(value, bound.max.unit)) {
                    return true;
                }
                return false;
            }
        };
    },
    select: function (column, selected) {
        appliedFilters[column] = function (cell) {
            var cellValue = cell.textContent.trim();

            if (selected) {
                return selected !== cellValue;
            } else {
                return false;
            }
        };
    }
};

function refresh () {
    var countVisible = 0;

    $('.filterable').forEach(function (row) {
        var isVisible = true;

        Object.keys(appliedFilters).forEach(function (column) {
            var cell = row.querySelector('.' + column);
            isVisible = isVisible && !appliedFilters[column](cell);
        });

        if (isVisible) {
            countVisible += 1;
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });

    $('.fronts--count')[0].innerHTML = countVisible;
}

function checkedValues (key) {
    var checked = [];
    $('.group--' + key).forEach(function (option) {
        if (option.checked) {
            checked.push(option.value);
        }
    });
    return checked;
}

function minMaxValues (key) {
    var values = {
        min: null,
        max: null
    };

    $('.group--' + key).forEach(function (option) {
        values[option.dataset.filterBy] = option.dataset.isDate === 'true' ?
            parseDate(option.value) :
            parseNumber(option.value);
    });
    return values;
}

function parseNumber (val) {
    if (val != null && val !== '') {
        return unformatNumeral(val);
    }
    return null;
}

function selectedValue (select) {
    return select.value;
}

function filterHandler (evt) {
    var classlist = evt.target.classList,
        by,
        column,
        group,
        values;

    if (classlist.contains('filter--checkbox')) {
        by = evt.target.dataset.filterBy;
        column = evt.target.dataset.filterCell;
        group = evt.target.dataset.group;
        values = checkedValues(group);

    } else if (classlist.contains('filter--text')) {
        by = 'value';
        column = evt.target.dataset.filterCell;
        group = evt.target.dataset.group;
        values = minMaxValues(group);

    } else if (classlist.contains('filter--date')) {
        by = 'date';
        column = evt.target.dataset.filterCell;
        group = evt.target.dataset.group;
        values = minMaxValues(group);

    } else if (classlist.contains('filter--select')) {
        by = 'select';
        column = evt.target.dataset.filterCell;
        values = selectedValue(evt.target);

    } else {
        return;
    }

    filters[by](column, values);
    refresh();
}

$('.filter').forEach(function (filter) {
    filter.addEventListener('click', filterHandler);
    filter.addEventListener('input', filterHandler);
});


// Extracted from numeral.js in package.json
function unformatNumeral (string) {
	var stringOriginal = string,
		thousandRegExp,
		millionRegExp,
		billionRegExp,
        value;

	// see if abbreviations are there so that we can multiply to the correct number
	thousandRegExp = new RegExp('[^a-zA-Z]k(?:\\)|(\\£)?(?:\\))?)?$');
	millionRegExp = new RegExp('[^a-zA-Z]m(?:\\)|(\\£)?(?:\\))?)?$');
	billionRegExp = new RegExp('[^a-zA-Z]b(?:\\)|(\\£)?(?:\\))?)?$');

	// do some math to create our number
	value = (
        ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) *
        ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) *
        ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) *
        (((string.split('-').length + Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2) ? 1 : -1) *
        Number(string.replace(/[^0-9\.]+/g, ''))
    );

	return value;
}

var shortDate = {
    'sec': 'seconds',
    'min': 'minutes',
    'mon': 'months'
};
function parseDate (string) {
    var value = null;
    string.replace(/^(\d+)\s*(\S*)$/, function (whole, number, unit) {
        value = {
            number: Number(number),
            unit: shortDate[unit] || unit
        };
    });
    return value;
}

function updateTime () {
    $('.filterable--edit').forEach(function (cell) {
        var timestamp = Number(cell.getAttribute('sorttable_customkey')) * 1000;
        if (timestamp) {
            cell.innerHTML = moment(timestamp).fromNow();
        }
    });
}

setInterval(updateTime, 1000 * 10);
updateTime();

}();
