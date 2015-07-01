!function () {

var $ = function () {
    return Array.prototype.slice.call(document.querySelectorAll.apply(document, arguments));
};
var appliedFilters = {};
var filters = {
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
    }
}

function refresh() {
    $('.filterable').forEach(function (row) {
        var isVisible = true;

        Object.keys(appliedFilters).forEach(function (column) {
            var cell = row.querySelector('.' + column);
            isVisible = isVisible && !appliedFilters[column](cell);
        });

        if (isVisible) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

function checkedValues(key) {
    var checked = [];
    $('.group--' + key).forEach(function (option) {
        if (option.checked) {
            checked.push(option.value);
        }
    });
    return checked;
}

function minMaxValues(key) {
    var values = {
        min: null,
        max: null
    };

    $('.group--' + key).forEach(function (option) {
        values[option.dataset.filterBy] = parseNumber(option.value);
    });
    return values;
}

function parseNumber(val) {
    if (val != null && val !== '') {
        return unformatNumeral(val);
    }
    return null;
}

function filterHandler (evt) {
    var classlist = evt.target.classList;

    if (classlist.contains('filter--checkbox')) {
        var by = evt.target.dataset.filterBy;
        var column = evt.target.dataset.filterCell;
        var group = evt.target.dataset.group;
        var values = checkedValues(group);

    } else if (classlist.contains('filter--text')) {
        var by = 'value';
        var column = evt.target.dataset.filterCell;
        var group = evt.target.dataset.group;
        var values = minMaxValues(group);

    } else {
        return;
    }

    filters[by](column, values);
    refresh();
};

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
        (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) *
        Number(string.replace(/[^0-9\.]+/g, ''))
    );

	return value;
}

}();
