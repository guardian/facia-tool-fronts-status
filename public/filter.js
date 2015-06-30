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
            var cellValue = parseNumber(cell.textContent.trim());

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
    // TODO it should understand human values?
    if (val != null && val !== '') {
        return Number(val).valueOf();
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

}();
