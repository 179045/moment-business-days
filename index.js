'use strict';

if (typeof require === 'function') {
  var moment = require('moment');
}

moment.fn.isHoliday = function () {
  var locale = this.localeData();

  if (locale._holidays) {
    if (locale._holidays.indexOf(this.format(locale._holidayFormat)) >= 0)
      return true;
  }

  if (locale.holiday) {
    if (locale.holiday(this)) {
      return true;
    }
    return false;
  }

  return false;
};

moment.fn.isBusinessDay = function () {
  var locale = this.localeData();
  var defaultWorkingWeekdays = [1, 2, 3, 4, 5];
  var workingWeekdays = locale._workingWeekdays || defaultWorkingWeekdays;

  if (this.isHoliday()) return false;
  if (workingWeekdays.indexOf(this.day()) >= 0) return true;

  return false;
};

moment.fn.businessDaysIntoMonth = function () {
  if (!this.isValid()) {
    return NaN;
  }
  var businessDay = this.isBusinessDay() ? this : this.prevBusinessDay();
  var monthBusinessDays = businessDay.monthBusinessDays();
  var businessDaysIntoMonth;
  monthBusinessDays.map(function (day, index) {
    if (day.format('M/DD/YY') === businessDay.format('M/DD/YY')) {
      businessDaysIntoMonth = index + 1;
    }
  });
  return businessDaysIntoMonth;
};

moment.fn.businessDiff = function (param, relative) {
  var d1 = this.clone();
  var d2 = param.clone();
  var positive = d1 >= d2;
  var start = d1 < d2 ? d1 : d2;
  var end = d2 > d1 ? d2 : d1;

  var daysBetween = 0;

  if (start.format('DD/MM/YYYY') === end.format('DD/MM/YYYY')) {
    return daysBetween;
  }

  while (start < end) {
    if (start.isBusinessDay()) {
      daysBetween++;
    }
    start.add(1, 'd');
  }

  if (relative) {
    return positive ? daysBetween : -daysBetween;
  }

  return daysBetween;
};

moment.fn.businessAdd = function (number, period) {
  var day = this.clone();
  if (!day.isValid()) {
    return day;
  }

  if (number < 0) {
    number = Math.round(-1 * number) * -1;
  } else {
    number = Math.round(number);
  }

  var signal = number < 0 ? -1 : 1;
  period = typeof period !== 'undefined' ? period : 'days';

  var remaining = Math.abs(number);
  while (remaining > 0) {
    day.add(signal, period);

    if (day.isBusinessDay()) {
      remaining--;
    }
  }

  return day;
};

moment.fn.businessSubtract = function (number, period) {
  return this.businessAdd(-number, period);
};

moment.fn.nextBusinessDay = function () {
  var locale = this.localeData();

  var loop = 1;
  var defaultNextBusinessDayLimit = 7;
  var limit = locale._nextBusinessDayLimit || defaultNextBusinessDayLimit;
  while (loop < limit) {
    if (this.add(1, 'd').isBusinessDay()) {
      break;
    }
    loop++;
  }
  return this;
};

moment.fn.prevBusinessDay = function () {
  var locale = this.localeData();

  var loop = 1;
  var defaultPrevBusinessDayLimit = 7;
  var limit = locale._prevBusinessDayLimit || defaultPrevBusinessDayLimit;
  while (loop < limit) {
    if (this.subtract(1, 'd').isBusinessDay()) {
      break;
    }
    loop++;
  }
  return this;
};

moment.fn.monthBusinessDays = function (partialEndDate) {
  if (!this.isValid()) {
    return [];
  }
  var me = this.clone();
  var day = me.clone().startOf('month');
  var end = partialEndDate ? partialEndDate : me.clone().endOf('month');
  var daysArr = [];
  var done = false;
  while (!done) {
    if (day.isBusinessDay()) {
      daysArr.push(day.clone());
    }
    if (end.diff(day.add(1, 'd')) < 0) {
      done = true;
    }
  }
  return daysArr;
};

moment.fn.monthNaturalDays = function (fromToday) {
  if (!this.isValid()) {
    return [];
  }
  var me = this.clone();
  var day = fromToday ? me.clone() : me.clone().startOf('month');
  var end = me.clone().endOf('month');
  var daysArr = [];
  var done = false;
  while (!done) {
    daysArr.push(day.clone());
    if (end.diff(day.add(1, 'd')) < 0) {
      done = true;
    }
  }
  return daysArr;
};

moment.fn.monthBusinessWeeks = function (fromToday) {
  fromToday = fromToday || false;
  var me = this.clone();
  var startDate = fromToday ? me.clone() : me.clone().startOf('month');
  return getBusinessWeeks(this, fromToday, null, startDate);
};

moment.fn.businessWeeksBetween = function (endDate) {
  var me = this.clone();
  var startDate = me.clone();
  return getBusinessWeeks(this, false, endDate, startDate);
};

var getBusinessWeeks = function (self, fromToday, endDate, startDate) {
  if (!self.isValid()) {
    return [];
  }
  var me = self.clone();
  var day = startDate;
  var end = endDate ? moment(endDate).clone() : me.clone().endOf('month');
  var weeksArr = [];
  var daysArr = [];
  var done = false;

  while (!done) {
    if (day.day() >= 1 && day.day() < 6) {
      daysArr.push(day.clone());
    }
    if (day.day() === 5) {
      weeksArr.push(daysArr);
      daysArr = [];
    }
    if (end.diff(day.add(1, 'd')) < 0) {
      if (daysArr.length < 5) {
        weeksArr.push(daysArr);
      }
      done = true;
    }
  }
  return weeksArr;
}

moment.fn.monthNaturalWeeks = function (fromToday) {
  if (!this.isValid()) {
    return [];
  }
  var me = this.clone();
  var day = fromToday ? me.clone() : me.clone().startOf('month');
  var end = me.clone().endOf('month');
  var weeksArr = [];
  var daysArr = [];
  var done = false;

  while (!done) {
    daysArr.push(day.clone());
    if (day.day() === 6) {
      weeksArr.push(daysArr);
      daysArr = [];
    }
    if (end.diff(day.add(1, 'd')) < 0) {
      if (daysArr.length < 7) {
        weeksArr.push(daysArr);
      }
      done = true;
    }
  }
  return weeksArr;
};

function WeekDayCalcException (message) {
    this.message = message;
    this.name = 'WeekDayCalcException';
}
WeekDayCalcException.prototype = new Error;
WeekDayCalc.prototype.WeekDayCalcException = WeekDayCalcException;

function DaysSetConverter (rangeStart, weekdays, exclusions, inclusions, useIsoWeekday) {
    this.rangeStart = moment(rangeStart);
    this.useIsoWeekday = (useIsoWeekday==true);
    this.exclusions = exclusions;
    this.inclusions = inclusions;
    this.weekdays = parseWeekdays(weekdays, this.useIsoWeekday);
}

DaysSetConverter.prototype.calculate = function(daysToAdd) {
    var daysLeft = daysToAdd;
    var resultDate = this.rangeStart.clone();
    var str_exclusions = parseSet(this.exclusions);
    var str_inclusions = parseSet(this.inclusions);
    var weekdayFunc = this.useIsoWeekday?'isoWeekday':'weekday';
    if (daysLeft>=0){
        /* positive value - add days */
        while (daysLeft > 0) {
            resultDate.add(1, 'day');
            var included = str_inclusions.length != 0 && str_inclusions.indexOf(resultDate.format("YYYY-MM-DD"))>=0;
            if (included || ((this.weekdays.indexOf(resultDate[weekdayFunc]()) >= 0) && (str_exclusions.length == 0 || str_exclusions.indexOf(resultDate.format("YYYY-MM-DD")) < 0))) {
                daysLeft--;
            }
        }
    } else {
        /* negative value - subtract days */
        while (daysLeft < 0) {
            resultDate.subtract(1, 'day');
            var included = str_inclusions.length != 0 && str_inclusions.indexOf(resultDate.format("YYYY-MM-DD"))>=0;
            if (included || ((this.weekdays.indexOf(resultDate[weekdayFunc]()) >= 0) && (str_exclusions.length == 0 || str_exclusions.indexOf(resultDate.format("YYYY-MM-DD")) < 0))) {
                daysLeft++;
            }
        }
    }
    return resultDate;
};

function DaysSetConverterException (message) {
    this.message = message;
    this.name = 'DaysSetConverterException';
}
DaysSetConverterException.prototype = new Error;
DaysSetConverter.prototype.DaysSetConverterException = DaysSetConverterException;

var parseWeekdays = function(weekdays, useIsoWeekday) {
    var validWeekdays = [];
    if (!weekdays) {
        throw new WeekDayCalcException('weekdays must be defined');
    }
    if (weekdays.length > 7) {
        throw new WeekDayCalcException("Weekdays array exceeding week length of 7 days");
    }
    for (var i=0;i<weekdays.length;i++) {
        var weekday = weekdays[i];
        if (useIsoWeekday) {
            if (isNaN(weekday)) throw new WeekDayCalcException("isoWeekDayCalc accepts weekdays as numbers only, try using weekdayCalc if you need a locale aware behaviour");
            if (weekday<1 || weekday>7) throw new WeekDayCalcException("The weekday is out of 1 to 7 range");
        } else if(!isNaN(weekday)){
            if (weekday<0 || weekday>6) throw new WeekDayCalcException("The weekday is out of 0 to 6 range");
        } else {
            weekday = moment().day(weekday).weekday();
        }
        if (validWeekdays.indexOf(weekday)>=0) {
            throw new WeekDayCalcException("Weekdays set contains duplicate weekday");
        }
        validWeekdays.push(weekday);
    }
    return validWeekdays;
};

DaysSetConverter.calculateDate = function(that, inArgs, useIsoWeekday) {
    var days, exclusions, inclusions, weekdaysSet;
    useIsoWeekday = useIsoWeekday?true:false;
    var rangeStart = that;
    switch (inArgs.length) {
        case 4:
            exclusions = inArgs[2];
            inclusions = inArgs[3];
        case 3:
            exclusions = inArgs[2];
        /* Fall-through to two args*/
        case 2:
            days = inArgs[0];
            weekdaysSet = inArgs[1];
            break;
        case 1:
            var arg = inArgs[0];
            if (arg && (arg.days!=undefined || arg.workdays!=undefined) ) {
                if (arg.days!=undefined && arg.workdays!=undefined) throw new DaysSetConverterException("days and weekdays args should not be used together, because weekdays is an alias of days");
                days = arg.days?arg.days:arg.workdays;
                weekdaysSet = arg.weekdays?arg.weekdays:[1,2,3,4,5];
                exclusions = arg.exclusions;
                inclusions = arg.inclusions;
            } else {
                days = arg;
            }
            break;
        default:
            new DaysSetConverterException('unexpected arguments length '+inArgs.length+'. Expecting 1 to 3 args');
    }
    var calc =  DaysSetConverter.construct([that, weekdaysSet, exclusions, inclusions, useIsoWeekday]);
    return calc.calculate(days);
};

moment.fn.isoAddWeekdaysFromSet = function() {
    return DaysSetConverter.calculateDate(this, arguments, true);
};

if (typeof module != 'undefined' && module.exports) {
  module.exports = moment;
}
