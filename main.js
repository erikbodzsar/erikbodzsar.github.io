d3.select("body").attr("onresize", "init(); refresh()");

max = function(a,b) { return a > b ? a : b; }
min = function(a,b) { return a < b ? a : b; }
roundToCents = function(x) { return Math.floor(x*100)/100.0; }

end = new Date(2080, 0, 1);

decEndDate = function() {
  if (end.getFullYear() < portfolios[0][0].getFullYear() + 15) return;
  end.setFullYear(end.getFullYear()-10);
  refresh();
}

incEndDate = function() {
  end.setFullYear(end.getFullYear()+10);
  refresh();
}

yyyyMmDd = function(date) {
  var pad = function(x) { return x < 10 ? ("0" + x) : ("" + x); };
  return "" + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

upgradeNodes = function(selection) {
  selection.nodes().forEach(function(x) { componentHandler.upgradeElement(x); });
  return selection;
}

setUpInitialPortfolio = function() {
  d3.select("#initialContainer").append(function() { return d3.select("#portfolioTemplate").node().cloneNode(true); }).attr("id", "initial");
  /* TODO WHY DONT THESE NEED UPGRADE?! IS MDL INIT AFTER THESE ARE FILLED IN? */
  d3.select("#initial").select(".portfolioHeader").select(".mdl-textfield").attr("class", "modName mdl-textfield mdl-js-textfield");
  d3.select("#initial").select(".portfolioBody").select(".mdl-textfield").attr("class", "mdl-textfield mdl-js-textfield mdl-textfield--floating-label");
  upgradeNodes(d3.select("#initial").select(".mdl-button").attr("class", "portfolioExpand mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab"));
  d3.select("#initial").select(".modDate").on("input", function() {
	  var mod = d3.select(ancestor(this, 3)).datum();
      var dateInputValue = d3.select(this).node().value.split("-");
      var y,m,d;
      [y,m,d] = dateInputValue;
      if (isNaN(y) || isNaN(m) || isNaN(d)) return;
      var date = new Date(y,m-1,d);
	  // TODO handle if after some mods
	  portfolios[0][0] = date;
	  validPortfoliosEnd = 1;
	  portfolios.length = 1;
	  refresh();
    });
  d3.select("#initial").select(".modDate").attr("value", yyyyMmDd(portfolios[0][0]));
  d3.select("#initial").select(".modDate").property("value", yyyyMmDd(portfolios[0][0]));
}

mouseX = 0;
mouseY = 0;

onPortfolioExpand = function(e) {
  var state = d3.select(e).select("i").text();
  if (state == "expand_more") {
    d3.select(e).select("i").text("expand_less");
	d3.select(ancestor(e,2)).select(".portfolioBody").attr("style", null);
  } else {
    d3.select(e).select("i").text("expand_more");
	d3.select(ancestor(e,2)).select(".portfolioBody").attr("style", "display: none");
  }
}

nextId = function() {
  var maxId = 0;
  var p = portfolios[0][1];
  var kinds = ["incomes", "expenses", "investments", "debts"];
  for (var a in kinds) {
	for (var x in p[kinds[a]]) {
	  var id = Number(x);
	  if (id > maxId) maxId = id;
	}
  }
  kinds = ["new_income", "new_expense", "new_investment", "new_debt"];
  for (var mi in mods) {
    var m = mods[mi];
    for (var a in kinds) {
	  for (var x in m[1][kinds[a]]) {
	    var id = Number(m[1][kinds[a]][x].id);
	    if (id > maxId) maxId = id;
	  }
	}
  }
  return maxId+1;
}

createMod = function() {
  return {
    name: "new life event",
	disabled: false,
    change_income: [],
    change_investment: [],
    new_income: [],
    new_expense: [],
    new_investment: [],
    new_debt: [],
    change_expense: [],
    change_debt: [],
  };
}

createAutoMod = function() {
  var mod = createMod();
  mod.auto = true;
  return mod;
}

createInvestment = function(name, monthly, start, interest, useAsCash, funding) {
  var id = nextId();
  var autoMod = createAutoMod();
  autoMod.name = name + " runs out";
  autoMods[id] = { mod: autoMod };
  return [id, {
    name: name,
    monthly: monthly,
    start: start,
    interest: interest,
	useAsCash: useAsCash,
	funding: funding,
  }];
}

createDebt = function(name, monthly, start, interest, useAsCash, funding) {
  var id = nextId();
  var autoMod = createAutoMod();
  autoMod.name = name + " paid off";
  autoMods[id] = { mod: autoMod };
  return [id, {
    name: name,
    monthly: monthly,
    start: start,
    interest: interest,
	useAsCash: useAsCash,
	funding: funding,
  }];
}

addExpense = function(i) {
  var addExpenseDiv = d3.select("#addExpense");
  mods[i][1].new_expense.push({
    id: nextId(),
	expense: {
      name: addExpenseDiv.select("#addExpenseName").property("value"),
      monthly: Number(addExpenseDiv.select("#addExpenseMonthly").property("value")),
      start: 0,
      interest: 0,
	},
  });
  addExpenseDiv.style("display", "none");
  
  validPortfoliosEnd = 1;
  fillModsTable();
  refreshChart();
}

addNewIncome = function(elem) {
  portfolios[0][1].incomes[nextId()] = {
    name: "new income",
    monthly: 1000,
    start: 0,
    interest: 0,
  };
  validPortfoliosEnd = 1;
  refresh();
}

addNewExpense = function(elem) {
  portfolios[0][1].expenses[nextId()] = {
    name: "new expense",
    monthly: 1000,
    start: 0,
    interest: 0,
  };
  validPortfoliosEnd = 1;
  refresh();
}

addNewInvestment = function(elem) {
  var idAndInv = createInvestment("new investment", 0, 1000, 0.01/12, false, 0);
  var id = idAndInv[0];
  var investment = idAndInv[1];
  portfolios[0][1].investments[id] = investment;
  validPortfoliosEnd = 1;
  refresh();
}

addNewDebt = function(elem) {
  var idAndDebt = createDebt("new debt", 0, 1000, 0.01/12, false, 0);
  var id = idAndDebt[0];
  var debt = idAndDebt[1];
  portfolios[0][1].debts[id] = debt;
  validPortfoliosEnd = 1;
  refresh();
}

addNewIncomeMod = function(elem) {
  var mod = d3.select(ancestor(elem, 4)).datum();
  mod[1].new_income.push({id: nextId(), income: {
    name: "new income",
    monthly: 1000,
    start: 0,
    interest: 0,
  }});
  clearPortfoliosAfter(mod[0]);
  refresh();
}

addNewExpenseMod = function(elem) {
  var mod = d3.select(ancestor(elem, 4)).datum();
  mod[1].new_expense.push({id: nextId(), expense: {
    name: "new expense",
    monthly: 1000,
    start: 0,
    interest: 0,
  }});
  clearPortfoliosAfter(mod[0]);
  refresh();
}

addNewInvestmentMod = function(elem) {
  var mod = d3.select(ancestor(elem, 4)).datum();
  var idAndInv = createInvestment("new investment", 0, 1000, 0.01/12, false, 0);
  mod[1].new_investment.push({id: idAndInv[0], investment: idAndInv[1]});
  clearPortfoliosAfter(mod[0]);
  refresh();
}

addNewDebtMod = function(elem) {
  var mod = d3.select(ancestor(elem, 4)).datum();
  var idAndDebt = createInvestment("new debt", 0, 1000, 0.01/12, false, 0);
  mod[1].new_debt.push({id: idAndDebt[0], debt: idAndDebt[1]});
  clearPortfoliosAfter(mod[0]);
  refresh();
}

newExpenseDialog = function(i) {
  var div = d3.select("#addExpense");
  div.style("display", "inline").style("top", mouseY + "px").style("left", mouseX+"px");
  div.select("#addExpenseAdd").attr("onclick", "addExpense("+i+")");
}

values = function(investment, from, to) {
  var ret = [{date: new Date(from), value: investment.start}];
  for (var i = new Date(from); i < to; i.setMonth(i.getMonth()+1)) {
    var prev = ret[ret.length-1];
    ret.push({date: new Date(i), value: prev.value + prev.value*investment.interest + investment.monthly});
  }
  return ret;
}

initSlider0 = function(slider) {
  var width = 400;
  var height = 10;
  slider.attr("transform", "translate(10, 10)");
  slider.append("rect").attr("width", width).attr("height", height).attr("style", "stroke:rgb(0,0,0);stroke-width:2;fill:rgb(255,255,255)");
}

/*
// elem is a svg g
initSlider = function(slider, begin, end, values, callback) {
  var width = 400;
  var height = 10;
  var xScale = d3.scaleLinear().domain([begin, end]).range([0, width]);
  sums = [values[0][1]];
  for (var i=1; i < values.length; i++) {
    sums.push(sums[i-1]+values[i][1]);
  }
  var fillers = slider.selectAll(".filler").data(values);
  var newFillers = fillers
      .enter()
          .append("rect")
              .attr("y", 2)
              .attr("height", height-4)
              .attr("class", "filler");
  var allFillers = newFillers.merge(fillers);
  allFillers
      .attr("x", (d,i) => xScale(i == 0 ? 0 : sums[i-1]))
      .attr("width", d => xScale(d[1]))
      .attr("style", d => "fill:" + colors[d[0]])
  fillers.exit().remove();

  var markers = slider.selectAll(".marker").data(sums)
      .enter()
          .append("circle")
              .attr("cx", d => xScale(d))
              .attr("cy", height/2)
              .attr("r", 10)
              .attr("class", "marker")
              .call(d3.drag().on("drag", function(d, i) { 
                var newValue = xScale.invert(d3.event.x);
                var delta = newValue - sums[i];
                var markers = d3.select(this.parentNode).selectAll(".marker");
                for (var j = i; j < sums.length; j++) {
                  sums[j] += delta;
                }
				values[0][1] = sums[0];
				for (var i = 1; i < sums.length; i++) {
				  values[i][1] = sums[i] - sums[i-1];
				}
                markers.data(sums).attr("cx", d => xScale(d));
				slider.selectAll(".filler").data(values).attr("x", (d,i) => xScale(i == 0 ? 0 : sums[i-1]))
                    .attr("width", d => xScale(d[1]));
				callback();
        	  }))
      .exit().remove();
}
*/

chartXPadding = 10;
chartYPadding = 10;

init = function() {
var boundingRect = d3.select("#chart").node().getBoundingClientRect();
yScale = d3.scaleLinear()
      .domain([80000.0, 5000000.0])
      .range([boundingRect.height-chartYPadding, 0]);
xScale = d3.scaleTime()
        .domain([new Date(), end])
        .range([chartXPadding, boundingRect.width]);
}
init();

total = function(portfolio) {
  var t = portfolio.cash;
  for (var id in portfolio.investments) {
    t += portfolio.investments[id].start;
  }
  for (var id in portfolio.debts) {
    t += portfolio.debts[id].start;
  }
  return t;
};
formatTotal = function(t) {
  t = ""+Math.floor(t);
  var start = t.length % 3;
  if (start == 0) start = 3;
  var ret = t.slice(0, start);
  for (var idx = start; idx < t.length; idx += 3) {
    ret = ret + "," + t.slice(idx, idx+3);
  }
  return ret;
};
mouseMove = function() {
  var x = d3.mouse(this)[0];
//  var y = d3.mouse(this)[1];
  var time = xScale.invert(x);
  d3.select("#chart").select("#mouseTimeLine")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", 0)
      .attr("y1", yScale.range()[1])
	  .attr("style", "");
  d3.select("#chart").select("#mouseBreakdown")
      .attr("transform", "translate("+(x+5)+", 50)")
	  .attr("style", "");
    d3.select("#chart").select("#mouseBreakdown").select("#mouseBreakdownDate").text(dateToString(time));
    d3.select("#chart").select("#mouseBreakdown").select("#mouseBreakdownTotal").text("Total: " + formatTotal(total(getPortfolio(time)[1])));

//  fillBreakdown(xScale.invert(x))
};
bodyMouseMove = function() {
  mouseX = d3.mouse(this)[0];
  mouseY = d3.mouse(this)[1];
}
d3.select("body").on("mousemove", bodyMouseMove);
d3.select("#chart").on("mousemove", mouseMove);

colors = ["#FFE0B2", "#FFB74D", "#FF9800", "#F57C00", "#E65100", "#BF360C"];

nextIdTmp = 1;

autoMods = {};

portfolio = {
  cash: 50000,
  investments: {},
  debts:{},
  incomes: {},
  expenses: {},
};

portfolio.incomes[nextIdTmp++] = {
  name: "Salary",
  monthly: 5000,
  start: 0,
  interest: 0,
};

portfolio.expenses[nextIdTmp++] = {
  name: "Living expenses",
  monthly: 2000,
  start: 0,
  interest: 0,
};

portfolio.expenses[nextIdTmp++] = {
  name: "Rent",
  monthly: 1500,
  start: 0,
  interest: 0,
};

portfolio.investments[nextIdTmp++] = {
  name: "401k",
  start: 5000.0,
  interest: 0.04/12,
  monthly: 0.0,
  funding: 500,
};

autoMods[nextIdTmp-1] = { mod: createAutoMod() };
autoMods[nextIdTmp-1].mod.name = "401k runs out";

portfolio.investments[nextIdTmp++] = {
  name: "Savings account",
  start: 50000.0,
  interest: 0.01/12,
  monthly: 1500.0,
  funding: 0,
};

autoMods[nextIdTmp-1] = { mod: createAutoMod() };
autoMods[nextIdTmp-1].mod.name = "Savings account runs out";

portfolios = [[new Date(), portfolio]];

getId = function(name, portfolio) {
  for (var p in portfolio) {
    for (var id in portfolio[p]) {
      if (portfolio[p][id].name == name) return id;
	}
  }
}

mods = [];

mods.push([new Date(2030, 0, 1), {
  name: "Buy a house",
  disabled: false,
  change_income: [],
  change_investment: [
    {id: getId("401k", portfolio), investment: { monthly: 0}},
    {id: getId("Savings account", portfolio), investment: { monthly: 0 }},
  ],
  change_expense: [{id: getId("Rent", portfolio), expense: { monthly: 0 }}],
  change_debt: [],
  new_income: [],
  new_expense: [{
    id: nextIdTmp++,
	expense: {
      name: "Home maintenance",
      monthly: 500,
      start: 0,
      interest: 0.00/12,
	}}],
  new_investment: [],
  new_debt: [{
    id: nextIdTmp++,
    debt: {
      name: "Mortgage",
      monthly: 3000,
      start: -200000,
      interest: 0.00/12,
    }
  }],
}]);

autoMods[nextIdTmp-1] = { mod: createAutoMod() };
autoMods[nextIdTmp-1].mod.name = "Mortgage paid off";

// TODO xxx Create* methods that automatically add autoMod

mods.push([new Date(2050, 0, 1), {
  name: "Retire",
  disabled: false,
  change_income: [{id: getId("Salary", portfolio), income: { monthly: 0 }}],
  change_investment: [
    {id: getId("401k", portfolio), investment: { funding: 0, monthly: 0, useAsCash: true}},
    {id: getId("Savings account", portfolio), investment: { funding: 0, monthly: 0, useAsCash: true}},
  ],
  change_expense: [],
  change_debt: [],
  new_income: [],
  new_expense: [],
  new_investment: [],
  new_debt: [],
}]);

setUpInitialPortfolio();

current_version = 5;

createURLParam = function() {
  var json = JSON.stringify([current_version,portfolios[0],mods,autoMods]);
  return btoa(json);
}
createURL = function() {
  return window.location.origin + window.location.pathname + "?data=" + createURLParam();
}
dateFormat = new RegExp('^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$');
parseDate = function(key, value) {
    if (typeof value === "string" && dateFormat.test(value)) {
        return new Date(value);
    }
    return value;
}
parse = function(version, data) {
  if (version == 0) {
    var oldPortfolios = data[0];
	var oldMods = data[1];
	for (var mod in oldMods) {
	  mod[1].name = "unnamed life event";
	}
	parse(1, [1, oldPortfolios, oldMods]);
  } else if (version == 1) {
    var oldPortfolios = data[1];
	var oldMods = data[2];
	for (var idx in oldMods) {
	  oldMods[idx][1].disabled = false;
	}
	parse(2, [2, oldPortfolios, oldMods]);
  } else if (version == 2) {
    var oldPortfolios = data[1];
	var oldMods = data[2];
	for (var i in oldPortfolios[1].investments) {
	  oldPortfolios[1].investments[i].funding = 0;
	}
	parse(3, [3, oldPortfolios, oldMods]);
  } else if (version == 3) {
    var oldPortfolios = data[1];
	var oldMods = data[2];
	var oldAutoMods = {};
	var inv = ["investments", "debts"];
	for (var i = 0; i < 2; i++) {
	  for (var id in oldPortfolios[1][inv[i]]) {
	    oldAutoMods[id] = {mod: createMod()};
		oldAutoMods[id].mod.name = oldPortfolios[1][inv[i]][id].name + (i == 0 ? " runs out" : " paid off");
	  }
	}
	for (var i = 0; i < oldMods.length; i++) {
	  for (var j = 0; j < oldMods[i].new_investment; j++) {
	    oldAutoMods[oldMods[i].new_investment[j].id] = {mod: createMod()};
		oldAutoMods[oldMods[i].new_investment[j].id].mod.name = oldMods[i].new_investment[j].investment.name + " paid off";
	  }
	}
	parse(4, [4, oldPortfolios, oldMods, oldAutoMods]);
  } else if (version == 4) {
    var oldPortfolios = data[1];
	var oldMods = data[2];
	var oldAutoMods = data[3];
    for (var id in oldAutoMods) oldAutoMods[id].mod.auto = true;
	parse(5, [5, oldPortfolios, oldMods, oldAutoMods]);
  } else if (version == current_version) {
    portfolios = [data[1]];
	mods = data[2];
	autoMods = data[3];
  }
}
initFromURLParam = function() {
  var dataStrIndex = location.href.indexOf("data=");
  if (dataStrIndex == -1) return;
  var encoded = location.href.substring(dataStrIndex+"data=".length, location.href.length);
  var data = JSON.parse(atob(encoded), parseDate);
  var version;
  if (data.length == 0) {
    version = 0;
  } else {
    version = data[0];
  }
  parse(version, data);
}
initFromURLParam();
urlClick = function() {
  d3.select("#url").attr("value", createURL());
  d3.select("#shareUrl").attr("style", "");
  d3.select("#url").node().focus();
  d3.select("#url").node().select();
  document.execCommand('copy');
}
hideUrl = function() {
  d3.select("#shareUrl").attr("style", "opacity: 0; width: 1px");
}

assign = function(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
}

entries = function(o) {
  var e = [];
  for (var p in o) {
    e.push([p, o[p]]);
  }
  return e;
}

applyMod = function(portfolio, mod) {
  if (mod.disabled) return;
  mod.change_income.map(function(x) { assign(portfolio.incomes[x.id], x.income); portfolio.incomes[x.id].hasMod = true; } );
  mod.change_expense.map(function(x) { assign(portfolio.expenses[x.id], x.expense); portfolio.expenses[x.id].hasMod = true; });
  mod.change_investment.map(function(x) { assign(portfolio.investments[x.id], x.investment); portfolio.investments[x.id].hasMod = true; });
  mod.change_debt.map(function(x) { assign(portfolio.debts[x.id], x.debt); portfolio.debts[x.id].hasMod = true; });
  mod.new_expense.map(function(x) { portfolio.expenses[x.id] = x.expense; portfolio.expenses[x.id].isNew = true; });
  mod.new_income.map(function(x) { portfolio.incomes[x.id] = x.income; portfolio.incomes[x.id].isNew = true; });
  mod.new_investment.map(function(x) { portfolio.investments[x.id] = x.investment; portfolio.investments[x.id].isNew = true; });
  mod.new_debt.map(function(x) { portfolio.debts[x.id] = x.debt; portfolio.debts[x.id].isNew = true; });
}

// returns overall monthly +/-
balance = function(portfolio) {
  var ret = 0;
  for (var id in portfolio["investments"]) {
    if (portfolio["investments"][id].useAsCash) continue;
	var m = portfolio["investments"][id].monthly;
	if (m < 0 && -m > portfolio["investments"][id].start) m = -portfolio["investments"][id].start;
    ret -= m;	
  }
  for (var id in portfolio["expenses"]) {
    ret -= portfolio["expenses"][id].monthly;
  }
  for (var id in portfolio["debts"]) {
    if (portfolio["debts"][id].useAsCash) continue;
	var m = portfolio["debts"][id].monthly;
	if (m > 0 && m > -portfolio["debts"][id].start) m = -portfolio["debts"][id].start;
    ret -= m;	
  }
  for (var id in portfolio["incomes"]) {
    ret += portfolio["incomes"][id].monthly;
  }
  return ret;
}

fillNextPortfolio = function(portfolio, nextPortfolio) {
  var copy = function(x) {
    var c = {};
	for (var id in x) {
      c[id] = assign({}, x[id]);
	  c[id].isNew = false;
	  c[id].hasMod = false;
	  c[id].ranOut = false;
	};
	return c;
  }
  var b = balance(portfolio);
  var next = nextPortfolio;
  assign(next, {
    cash: portfolio.cash,
    investments: copy(portfolio.investments),
    debts: copy(portfolio.debts),
    incomes: copy(portfolio.incomes),
    expenses: copy(portfolio.expenses),
  });
  var update = function(x, kind) {
    var old = x.start;
    if ('useAsCash' in x && x.useAsCash) {
	  x.start = x.start + x.start * x.interest;
	  var withdrawal = max(min(-b, x.start), 0);
	  x.start -= withdrawal;
	  b += withdrawal;
	} else if (kind == "debts") {
      x.start = min(0, x.start + x.start * x.interest + x.monthly + ('funding' in x ? x.funding : 0));
	} else {
      x.start = max(0, x.start + x.start * x.interest + x.monthly + ('funding' in x ? x.funding : 0));
	}
	if (old != 0 && x.start == 0) x.ranOut = true;
	x.start = roundToCents(x.start);
  };
  var kindsToUpdate = ["investments", "debts"];
  for (var i = 0; i < kindsToUpdate.length; i++) {
    var p = kindsToUpdate[i];
    for (var id in next[p]) {
	  update(next[p][id], p);
	}
  }
  next.cash += b;
  return next;
}

validPortfoliosEnd = 1;

getAllMods = function() {
  var allMods = [];
  for (var i = 0; i < mods.length; i++) {
    allMods.push(mods[i]);
  }
  for (var id in autoMods) {
    if ('date' in autoMods[id]) {
      allMods.push([autoMods[id].date, autoMods[id].mod]);
	}
  }
  allMods.sort(function(a,b) {
	if (a[0] < b[0]) return -1;
	if (a[0] > b[0]) return 1;
    return 0;
  });
  return allMods;
}

fillPortfolios = function(until) {
  var last = portfolios[validPortfoliosEnd-1];
  if (last[0] < until) {
    for (var idx in autoMods) {
	  if ('date' in autoMods[idx] && autoMods[idx].date > last[0]) {
	    delete autoMods[idx].date;
	  }
	}
  }
  var nextMonth = function(date) {
    date.setMonth(date.getMonth()+1);
    return date;
  }
  var allMods = getAllMods();
  var mods_idx = 0;
  var startDate = last[0];
  var foundAutoMods = {};
  for (var date = nextMonth(new Date(last[0])); date <= until; nextMonth(date)) {
    last = portfolios[validPortfoliosEnd-1];
    for (; mods_idx < allMods.length && allMods[mods_idx][0] <= last[0]; mods_idx++) {}
    if (validPortfoliosEnd == portfolios.length) {
	  portfolios.push([new Date(date), {}]);
	}
	fillNextPortfolio(portfolios[validPortfoliosEnd-1][1], portfolios[validPortfoliosEnd][1]);
	for (var kind in portfolios[validPortfoliosEnd][1]) {
	  for (var id in portfolios[validPortfoliosEnd][1][kind]) {
	    if (portfolios[validPortfoliosEnd][1][kind][id].ranOut) {
		  autoMods[id].date = new Date(date);
		  applyMod(portfolios[validPortfoliosEnd][1], autoMods[id].mod); // TODO CAN THESE BE DOUBLE-APPLIED WITH MODS BELOW?
		  foundAutoMods[id] = true;
		}
	  }
	}
	var next = nextMonth(new Date(date));
	for (; mods_idx < allMods.length && allMods[mods_idx][0] <= date; mods_idx++) {
	  applyMod(portfolios[validPortfoliosEnd][1], allMods[mods_idx][1]);
	}
	validPortfoliosEnd++;
  }
  for (var id in autoMods) {
    if (!(id in foundAutoMods) && autoMods[id].date >= startDate) {
	  delete autoMods[id].date;
	}
  }
}
fillPortfolios(end);

getPortfolio = function(date) {
  var fillDate = new Date(date);
  fillDate.setMonth(date.getMonth()+1);
  fillPortfolios(fillDate);
  for (var i = 0; i < portfolios.length - 1; i++) {
    if (portfolios[i][0] >= date) {
      return portfolios[i];
    }
  }
  return portfolios[portfolios.length-1];
}

clearPortfoliosAfter = function(date) {
  var idx = 0;
  for (; idx < portfolios.length; idx++) {
    if (portfolios[idx][0] >= date) {
	  break;
	}
  }
  validPortfoliosEnd = idx;
}

dateToString = function(d) {
 return "" + d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate()
}

fillBreakdown = function(date) {
  d3.select(".breakdown").select(".date").text(dateToString(date));
  var portfolio = getPortfolio(date)[1];
  var values = [["total", 0], ["cash", portfolio.cash]];
  var total = portfolio.cash;
  for (var id in portfolio.investments) {
    total = total + portfolio.investments[id].start;
    values.push([portfolio.investments[id].name, portfolio.investments[id].start]);
  }
  values[0][1] = total;
  // TODO: cash, debts
  var breakdownValues = d3.select(".breakdown").selectAll(".breakdownValue").data(values);
  breakdownValues.text(function(d) { return d[0] + ": " + Math.round(d[1]); });
  breakdownValues.enter().append("div").attr("class", "breakdownValue");
  breakdownValues.exit().remove();
}

refresh = function () {
  console.log("refreshing");
  refreshChart();
  fillInitialTable();
//  fillInitialSlider();
  fillModsTable();
};

removeModsForId = function(id) {
  var modKinds = ["change_income", "change_expense", "change_investment", "change_debt"];
  for (var i = 0; i < mods.length; i++) {
    for (var j = 0; j < modKinds.length; j++) {
	  var to_remove = [];
      for (var k = 0; k < mods[i][1][modKinds[j]].length; k++) {
  	    if (mods[i][1][modKinds[j]][k].id == id) {
		  to_remove.push(k);
  	    }
      }
      for (var k = to_remove.length - 1; k >= 0; k--) {	  
	     mods[i][1][modKinds[j]].splice(to_remove[k], 1);
      }
    }
  }
}

fillInitialTable = function() {
  var initialPortfolio = d3.select("#initial").select(".portfolioBody");
  initialPortfolio.datum(portfolios[0]);
  portfolioTable(initialPortfolio, function(x) { return x; }, true,
      function(data, kind, id, property, value) {
        data[1][kind][id][property] = value;
        validPortfoliosEnd = 1;
    	refresh();
      },
	  function(data, kind, id) {
	    if (!confirm("Remove " + data[1][kind][id].name + "?")) return;
		delete data[1][kind][id];
		removeModsForId(id);
        validPortfoliosEnd = 1;
		refresh();
	  },
	  function() {}
  );
}

d3.select("#interestSelect").on("input", function() { refresh(); });

ancestor = function(node, n) {
  if (n <= 0) return node;
  return ancestor(node.parentNode, n-1);
}

portfolioTable = function(container, getPortfolioFn, isInitial, propertyCb, deleteCb, undoModsCb) {
  var cashContainer = container.select(".cashContainer");
  var cash = cashContainer.select("input");
  cash.on("input", function() { getPortfolioFn(d3.select(this).datum())[1].cash = Number(this.value); validPortfoliosEnd = 1; refresh(); });
  if (!isInitial) {
    cash.attr("disabled", "");
  }
  cash.attr("value", function(d) { return getPortfolioFn(d)[1].cash; });
  cash.property("value", function(d) { return getPortfolioFn(d)[1].cash; });
  
  var isNumeric = function(property) {
    if (property == "name") return false;
	return true;
  };
  var printProperty = function(property, d) {
    if (property == 'monthly' && 'useAsCash' in d[1] && d[1].useAsCash) return "N/A";
    var value = d[1][property];
    if (property == "interest" && d3.select("#interestSelect").node().value == "yearly") {
	  value = value * 12;
	}
	return "" + value;
  };
  var parseProperty = function(property, value) {
    if (isNumeric(property)) value = Number(value);
    if (property == "interest" && d3.select("#interestSelect").node().value == "yearly") {
	  value = value / 12;
	}
	return value;
  };

  var addProperty = function(newContainers, allContainers, property, enabled, cols, colsTablet, colsPhone) {
    var inputClass = "input-" + property;
	var gridDiv = newContainers.append("div")
	    .attr("class", "mdl-cell mdl-cell--" + cols + "-col " + "mdl-cell--" + colsTablet + "-col-tablet mdl-cell--" + colsPhone + "-col-phone");
    var inputDiv = gridDiv.append("div").attr("class", "mdl-textfield mdl-js-textfield mdl-textfield--floating-label");
	var idFn = function(d) { return property + "-" + d[0] + "-" + d3.select(ancestor(this, 8)).attr("data-idx"); };
    var input = inputDiv.append("input")
	    .on("input", function() { propertyCb(d3.select(ancestor(this, 7)).datum(), d3.select(ancestor(this,3)).attr("data-kind"), d3.select(ancestor(this,3)).attr("data-id"), property, parseProperty(property, this.value)); })
		.attr("type", "text")
		.attr("id", idFn)
		.attr("size", property == 'name' ? "20" : "9")
		.attr("class", inputClass + " mdl-textfield__input");
    upgradeNodes(inputDiv.append("label").attr("class", "mdl-textfield__label").attr("for", idFn).text(property));

    var disabled = function(d) {
	  if (property == 'monthly' && 'useAsCash' in d[1] && d[1].useAsCash) return true;
	  if (d[1].isNew || enabled) return false;
	  return true;
	};
	allContainers.select("." + inputClass).merge(input)
		.attr("value",function(d) { return printProperty(property, d); })
		.property("value", function(d) { return printProperty(property, d); })
		.attr("disabled", function(d) { return disabled(d) ? "" : null; });
	upgradeNodes(inputDiv);
  };
  var incomeList = ["incomes", "expenses"];
  for (var idx in incomeList) {
    var kind = incomeList[idx];
    var currentContainer = container.select("."+kind+"Container");
    var incomes = currentContainer.selectAll("." + kind).data(function(d) { return entries(getPortfolioFn(d)[1][kind]); });
	incomes.exit().remove();
	var newIncomes = incomes.enter().append("div").attr("class", kind + " mdl-grid").attr("data-kind", kind).attr("style", "position: relative");
	var buttons = newIncomes.append("div").attr("style", "position: absolute; top: 2px; right: 2px; z-index: 2");
	buttons.append("button")  
		.attr("class", "undoModsButton mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored")
		.on("click", function() { undoModsCb(d3.select(ancestor(this, 6)).datum(), d3.select(ancestor(this,2)).attr("data-kind"), d3.select(ancestor(this,2)).attr("data-id")); })
		.append("i").attr("class", "material-icons").html("undo");
	buttons.append("button")
	    .attr("style", function(d) {
		  var display;
		  if (isInitial || ('isNew' in d[1] && d[1].isNew)) display = "";
		  else display = "; display: none";
		  return "transform: scale(0.8)" + display;
		})
		.attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored")
		.on("click", function() { deleteCb(d3.select(ancestor(this, 6)).datum(), d3.select(ancestor(this,2)).attr("data-kind"), d3.select(ancestor(this,2)).attr("data-id")); })
		.append("i").attr("class", "material-icons").html("delete");
    upgradeNodes(newIncomes.select(".mdl-button"));
    var allIncomes = newIncomes.merge(incomes);
	allIncomes.select(".undoModsButton").attr("style", function(d) {
	  var display;
      if ('hasMod' in d[1] && d[1].hasMod) display = "";
	  else display = "; display: none";
	  return "transform: scale(0.8)" + display;
	})
	allIncomes.attr("data-id", function(d) { return d[0]; });
	addProperty(newIncomes, allIncomes, "name", isInitial, 6, 4, 2);
	addProperty(newIncomes, allIncomes, "monthly", true, 6, 4, 2);
  }
  
  var investmentList = ["investments", "debts"];
  for (var idx in investmentList) {
    var kind = investmentList[idx];
    var currentContainer = container.select("."+kind+"Container");
    var investments = currentContainer.selectAll("." + kind).data(function(d) { return entries(getPortfolioFn(d)[1][kind]); });
	investments.exit().remove();
	var newInvestments = investments.enter().append("div").attr("class", kind + " mdl-grid").attr("data-id", function(d) { return d[0]; }).attr("data-kind", kind).attr("style", "position: relative");
	var buttons = newInvestments.append("div").attr("style", "position: absolute; top: 2px; right: 2px; z-index: 2");
	buttons.append("button")  
		.attr("class", "undoModsButton mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored")
		.on("click", function() { undoModsCb(d3.select(ancestor(this, 6)).datum(), d3.select(ancestor(this,2)).attr("data-kind"), d3.select(ancestor(this,2)).attr("data-id")); })
		.append("i").attr("class", "material-icons").html("undo");
	buttons.append("button")
	    .attr("style", function(d) {
		  var display;
		  if (isInitial || ('isNew' in d[1] && d[1].isNew)) display = "";
		  else display = "; display: none";
		  return "transform: scale(0.8)" + display;
		})
		.attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored")
		.on("click", function() { deleteCb(d3.select(ancestor(this, 6)).datum(), d3.select(ancestor(this,2)).attr("data-kind"), d3.select(ancestor(this,2)).attr("data-id")); })
		.append("i").attr("class", "material-icons").html("delete");
    upgradeNodes(newInvestments.select(".mdl-button"));
    var allInvestments = newInvestments.merge(investments);
	allInvestments.select(".undoModsButton").attr("style", function(d) {
	  var display;
      if ('hasMod' in d[1] && d[1].hasMod) display = "";
	  else display = "; display: none";
	  return "transform: scale(0.8)" + display;
	})
	addProperty(newInvestments, allInvestments, "name", isInitial, 6, 4, 2);
	addProperty(newInvestments, allInvestments, "start", isInitial, 6, 4, 2);
	addProperty(newInvestments, allInvestments, "monthly", true, 6, 4, 2);
	addProperty(newInvestments, allInvestments, "interest", true, 6, 4, 2);

	if (kind == "investments") {
	  addProperty(newInvestments, allInvestments, "funding", true, 6, 4, 2);
    }

	var idFn1 = function(d) { return kind + "-useAsCash-" + d[0] + "-" + d3.select(ancestor(this, 6)).attr("data-idx"); };
	var idFn2 = function(d) { return kind + "-useAsCash-" + d[0] + "-" + d3.select(ancestor(this, 7)).attr("data-idx"); };
    var newCoverExpenses = newInvestments.append("label").attr("style", "height: initial").attr("class", "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect").attr("for", idFn1);
	newCoverExpenses.append("input")
	    .attr("type", "checkbox")
		.attr("id", idFn2)
		.attr("class", "mdl-checkbox__input coverExpenses")
		.on("click", function() { propertyCb(d3.select(ancestor(this, 6)).datum(), d3.select(ancestor(this,2)).attr("data-kind"), Number(d3.select(ancestor(this,2)).attr("data-id")), "useAsCash", this.checked); });
	newCoverExpenses.append("span").attr("class", "mdl-checkbox__label").text("Cover expenses from this account?");
	upgradeNodes(newCoverExpenses);
	allInvestments.select(".coverExpenses").attr("checked", function(d) { d[1].useAsCash ? this.parentNode.MaterialCheckbox.check() : this.parentNode.MaterialCheckbox.uncheck(); return d[1].useAsCash ? "" : null; });
  }
}

fillInitialTable();

getTotalIncome = function(portfolio) {
  var totalIncome = 0;
  for (var id in portfolio.incomes) {
    totalIncome += portfolio.incomes[id].monthly;
  }
  for (var id in portfolio.expenses) {
    totalIncome -= portfolio.expenses[id].monthly;
  }
  for (var id in portfolio.investments) {
    totalIncome += max(0, -portfolio.investments[id].monthly);
  }
  for (var id in portfolio.debts) {
    totalIncome += max(0, -portfolio.debts[id].monthly);
  }
  return totalIncome;
}

fillInitialSlider = function() {
  var distribution = [];
  for (var id in portfolios[0][1].investments) {
   distribution.push([id, portfolios[0][1].investments[id].monthly]);
  }
  // TODO debts
  initSlider(d3.select(".slider"), 0, getTotalIncome(portfolios[0][1]), distribution, function() {
    for (var i=0; i < distribution.length; i++) {
	  portfolios[0][1].investments[distribution[i][0]].monthly = distribution[i][1];
	}
	validPortfoliosEnd = 1;
	refresh();
  });
}

initSlider0(d3.select(".slider"));
// fillInitialSlider();

distributionSlider = function() {
  
}

addNewMod = function(type) {
  var allMods = getAllMods();
  var date;
  if (allMods.length == 0) {
    date = new Date(start);
  } else {
    date = new Date(allMods[allMods.length-1][0]);
  }
  date.setFullYear(date.getFullYear()+5);
  if (date.getFullYear() > end.getFullYear() - 5) end.setFullYear(date.getFullYear()+5);
  
  var newMod = [date, createMod()];
  mods.push(newMod);
  
  if (type == 'retire') {
    newMod[1].name = "Retire";
  } else if (type == 'buyhouse') {
    newMod[1].name = "Buy a house";
	// TODO!
  }
  refresh();
}

removeMod = function(element) {
  if (!confirm("Remove life event?")) return;
  var mod = d3.select(element).datum();
  var idx;
  for (idx = 0; idx < mods.length; idx++) {
    if (mods[idx] === mod) break;
  }
  mods.splice(idx, 1);
  clearPortfoliosAfter(mod[0]);
  refresh();
}

disableMod = function(element) {
  var mod = d3.select(element).datum();
  mod[1].disabled = !mod[1].disabled;
  clearPortfoliosAfter(mod[0]);
  refresh();
}

fillModsTable = function() {
  var allMods = getAllMods();
  var modContainers = d3.select("#portfolioGrid").selectAll(".modPortfolio").data(allMods);
  modContainers.exit().remove();
  var newModContainers = modContainers.enter().append("div").attr("class", "mdl-cell mdl-cell--3-col modPortfolio  mdl-cell--4-col-tablet  mdl-cell--6-col-phone").append(function() { return d3.select("#portfolioTemplate").node().cloneNode(true); }).attr("id", null);
  newModContainers.select(".newIncome").attr("onclick", "addNewIncomeMod(this)");
  newModContainers.select(".newExpense").attr("onclick", "addNewExpenseMod(this)");
  newModContainers.select(".newInvestment").attr("onclick", "addNewInvestmentMod(this)");
  newModContainers.select(".newDebt").attr("onclick", "addNewDebtMod(this)");
  newModContainers.select(".cashContainer").select("input").attr("id", function(d,i) { return "initialCash" + i; }).attr("value", "0");
  newModContainers.select(".cashContainer").select("label").attr("for", function(d,i) { return "initialCash" + i; });
  upgradeNodes(newModContainers.select(".cashContainer").select(".mdl-textfield").attr("class", "mdl-textfield mdl-js-textfield mdl-textfield--floating-label"));
 
  var newHeaders = newModContainers.select(".portfolioHeader");
  newHeaders.select(".modName").select("input").on("input", function() {
	var mod = d3.select(ancestor(this, 4)).datum();
	mod[1].name = d3.select(this).node().value;
	refresh();
  });
  upgradeNodes(newHeaders.select(".modName").attr("class", "modName mdl-textfield mdl-js-textfield"));
  upgradeNodes(newHeaders.select(".mdl-button").attr("class", "portfolioExpand mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab"));

  var headerButtons = newHeaders.append("div").attr("style", "position: absolute; top: 5px; right: 5px");
  headerButtons.append("button").attr("class", "disableMod mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored").append("i").attr("class", "material-icons").html("power_settings_new");
  headerButtons.append("button").attr("class", "removeMod mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored").append("i").attr("class", "material-icons").html("delete");

  newHeaders.select(".modDate").on("input", function() {
	  var mod = d3.select(ancestor(this, 3)).datum();
      var dateInputValue = d3.select(this).node().value.split("-");
      var y,m,d;
      [y,m,d] = dateInputValue;
      if (isNaN(y) || isNaN(m) || isNaN(d)) return;
      var date = new Date(y,m-1,d);
	  var min = date < mod[0] ? date : mod[0];
	  mod[0] = date;
	  for (var i = 0; i < mods.length - 1; i++) {
	    if (mods[i][0] > mods[i+1][0]) {
		  this.blur();
		  break;
		}
	  }
	  mods.sort(function(a,b) {
	    if (a[0] < b[0]) return -1;
		if (a[0] > b[0]) return 1;
        return 0;
	  });  // TODO no longer necessary because getAllMods is sorted?
	  // TODO prevent going before start
	  clearPortfoliosAfter(min);
	  refresh();
    });
	
  upgradeNodes(newHeaders.selectAll("button"));
  
  var allModContainers = newModContainers.merge(modContainers);
  allModContainers.attr("style", function(d) { return d[1].disabled ? "opacity: 0.5" : null; });
  allModContainers.attr("data-idx", function(d,i) { return i; });
  var allHeaders = allModContainers.select(".portfolioHeader");
  allHeaders.select(".disableMod").attr("onclick", "disableMod(this)").attr("style", function(d) { return "margin-right: 0.5em; " + ('auto' in d[1] ? "display: none" : ""); });
  allHeaders.select(".removeMod").attr("onclick", "removeMod(this)").attr("style", function(d) { return 'auto' in d[1] ? "display: none" : null; });
  allHeaders.select(".modName").select("input").attr("value", function(d) { return d[1].name; });
  allHeaders.select(".modName").select("input").property("value", function(d) { return d[1].name; });
  allHeaders.select(".modName").select("input").attr("disabled", function(d) { return 'auto' in d[1] ? "" : null; });
  allHeaders.select(".modDate").attr("value", function(d) { return yyyyMmDd(d[0]); });
  allHeaders.select(".modDate").property("value", function(d) { return yyyyMmDd(d[0]); });
  allHeaders.select(".modDate").attr("disabled", function(d) { return 'auto' in d[1] ? "" : null; });
  portfolioTable(allModContainers.select(".portfolioBody"), function(d) { return getPortfolio(d[0]); },
    false,
    function(mod, kind, id, property, value) {
	  var modKind;
	  var name;
	  var newModKind;
	  if (kind == "investments") {
	    modKind = "change_investment";
		newModKind = "new_investment";
		name = "investment";
	  } else if (kind == "debts") {
	    modKind = "change_debt";
		newModKind = "new_debt";
		name = "debt";
      } else if (kind == "expenses") {
	    modKind = "change_expense";
		newModKind = "new_expense";
		name = "expense";
	  } else if (kind == "incomes") {
	    modKind = "change_income";
		newModKind = "new_income";
		name = "income";
	  }
	  var changesNewMod = false;
	  for (var idx in mod[1][newModKind]) {
	    if (mod[1][newModKind][idx].id == id) {
		  mod[1][newModKind][idx][name][property] = value;
	      clearPortfoliosAfter(mod[0]);
	      refresh();
		  return;
		}
	  }
	  var found_idx = null;
	  for (var idx in mod[1][modKind]) {
	    if (mod[1][modKind][idx].id == id) {
		  found_idx = idx;
		  break;
		}
	  }
	  if (found_idx == null) {
		found_idx = mod[1][modKind].length;
	    mod[1][modKind].push({ id: id });
	  }
	  if (mod[1][modKind][found_idx][name] === undefined) {
	    mod[1][modKind][found_idx][name] = {};
	  }
	  mod[1][modKind][found_idx][name][property] = value
	  clearPortfoliosAfter(mod[0]);
	  refresh();
    },
    function(mod, kind, id) {
	  var name;
	  var newModKind;
	  if (kind == "investments") {
		newModKind = "new_investment";
		name = "investment";
	  } else if (kind == "debts") {
		newModKind = "new_debt";
		name = "debt";
      } else if (kind == "expenses") {
		newModKind = "new_expense";
		name = "expense";
	  } else if (kind == "incomes") {
		newModKind = "new_income";
		name = "income";
	  }
	  var found_idx = null;
 	  for (var idx in mod[1][newModKind]) {
	    if (mod[1][newModKind][idx].id == id) {
		  found_idx = idx;
		  break;
		}
	  }
	  if (found_idx == null) { console.log("Couldn't find mod with id " + id); return; }
	  if (!confirm("Remove " + mod[1][newModKind][found_idx][name].name + "?")) return;
      mod[1][newModKind].splice(found_idx, 1);
	  clearPortfoliosAfter(mod[0]);
	  removeModsForId(id);
	  refresh();
    },
    function(mod, kind, id) {
	  var name;
	  var changeModKind;
	  if (kind == "investments") {
		changeModKind = "change_investment";
		name = "investment";
	  } else if (kind == "debts") {
		changeModKind = "change_debt";
		name = "debt";
      } else if (kind == "expenses") {
		changeModKind = "change_expense";
		name = "expense";
	  } else if (kind == "incomes") {
		changeModKind = "change_income";
		name = "income";
	  }
	  var found_idx = null;
 	  for (var idx in mod[1][changeModKind]) {
	    if (mod[1][changeModKind][idx].id == id) {
		  found_idx = idx;
		  break;
		}
	  }
	  if (found_idx == null) { console.log("Couldn't find mod for id " + id); return; }
	  if (!confirm("Undo all changes to " + getPortfolio(mod[0])[1][kind][id].name + "?")) return;
	  clearPortfoliosAfter(mod[0]);
      mod[1][changeModKind].splice(found_idx, 1);
	  refresh();
    });
  d3.select("#portfolioGrid").node().appendChild(d3.select("#addModButtons").node());
}

fillModsTable();

refreshChart = function() {
fillPortfolios(end);
var chart = d3.select("#chart").select("#mainChart");
xScale.domain([portfolios[0][0], end]);

var lineValuesMap = {};
var maxId = nextId();
for (var i = 0; i < maxId; i++) { lineValuesMap[i] = []; }
var idToIdx = {};
var idx = 0;
for (var id in portfolios[0][1].debts) {
  idToIdx[id] = idx++;
}
for (var i = 0; i < mods.length; i++) {
  for (var j = 0; j < mods[i][1].new_debt.length; j++) {
    idToIdx[mods[i][1].new_debt[j].id] = idx++;
  }
}
idToIdx[0] = idx++;
for (var id in portfolios[0][1].investments) {
  idToIdx[id] = idx++;
}
for (var i = 0; i < mods.length; i++) {
  for (var j = 0; j < mods[i][1].new_investment.length; j++) {
    idToIdx[mods[i][1].new_investment[j].id] = idx++;
  }
}

var linePointsToRender = 100;
var incMillis = (end.getTime() - portfolios[0][0].getTime()) / linePointsToRender;
var datesToRender = [];
for (var millis = portfolios[0][0].getTime(); millis < end.getTime(); millis += incMillis) {
  datesToRender.push(new Date(millis));
}
datesToRender.push(new Date(end));
for (var i = 0; i < mods.length; i++) {
  datesToRender.push(new Date(mods[i][0]));
}
datesToRender.sort(function(a,b) {
  if (a.getTime() < b.getTime()) {
    return -1;
  } else if (a.getTime() == b.getTime()) {
    return 0;
  } else {
    return 1;
  }
});

datesToRender.forEach(function(d) {
  var p = getPortfolio(d);
  lineValuesMap[idToIdx[0]].push({date: p[0], value: p[1].cash});
  for (var i = 1; i < maxId; i++) {
    if (!(i in idToIdx)) continue;
    if (i in p[1].investments) {
	  lineValuesMap[idToIdx[i]].push({date: p[0], value: p[1].investments[i].start});
	} else if (i in p[1].debts) {
	  lineValuesMap[idToIdx[i]].push({date: p[0], value: p[1].debts[i].start});
	} else {
	  lineValuesMap[idToIdx[i]].push({date: p[0], value: 0});
	}
  }
});

var to_delete = [];
for (var i in lineValuesMap) {
  var empty = true;
  for (var j in lineValuesMap[i]) {
    if (lineValuesMap[i][j].value != 0) {
	  empty = false;
	  break;
	}
  }
  if (empty) {
    to_delete.push(i);
  }
}
to_delete.forEach(function(i) { delete lineValuesMap[i]; });
var lineValues = entries(lineValuesMap);
var minValue = 0.0;
var maxValue = 0.0;
  var stackedValues = [];
  for (var i = 0; i < lineValues.length; i++) {
    var current = [];
    for (var j = 0; j < lineValues[i][1].length; j++) {
	  if (i == 0) {
	    var v = lineValues[i][1][j].value;
	    var bottom = min(v, 0);
		var top = max(v, 0);
	    current.push({date: lineValues[i][1][j].date, value: top, prev: bottom});
	  } else {
	    var v1 = lineValues[i][1][j].value + stackedValues[i-1][j].value;
		var v2 = stackedValues[i-1][j].value;
	    var bottom = min(v1, v2);
		var top = max(v1, v2);
	    current.push({date: lineValues[i][1][j].date, value: top, prev: bottom});
	  }
	}
	stackedValues.push(current);
  }
  for (var i = 0; i < stackedValues.length; i++) {
    for (var j = 0; j < stackedValues[i].length; j++) {
	  minValue = min(minValue, stackedValues[i][j].prev);
	  maxValue = max(maxValue, stackedValues[i][j].value);
	}
  }
  yScale.domain([minValue,maxValue]);
  var areas = chart.selectAll(".area").data(stackedValues);
  var area = d3.area()
	  .x(function(v) { return xScale(v.date); })
	  .y0(function(v) { return yScale(v.prev); })
	  .y1(function(v) { return yScale(v.value); });
  var newAreas = areas.enter().append("path").attr("class", "area").attr("fill", "none").attr("stroke-width", 1);
  var allAreas = newAreas.merge(areas);
  allAreas.attr("d", area).attr("stroke", function(d,i) { return colors[i]; }).attr("fill", function(d,i) { return colors[i]; });
  areas.exit().remove();

var yTickDistance = (maxValue - minValue) / 5;
var yTickDistanceRounded = Math.pow(10, Math.round(Math.log(yTickDistance) / Math.log(10)));
var yTickDistanceFinal = yTickDistanceRounded;
if (Math.abs(yTickDistanceFinal / 2.0 - yTickDistance) < Math.abs(yTickDistanceFinal - yTickDistance)) {
   yTickDistanceFinal = yTickDistanceFinal / 2.0;
} else if (Math.abs(yTickDistanceFinal * 2 - yTickDistance) < Math.abs(yTickDistanceFinal - yTickDistance)) {
   yTickDistanceFinal = yTickDistanceFinal * 2;
} else if (Math.abs(yTickDistanceFinal * 5 - yTickDistance) < Math.abs(yTickDistanceFinal - yTickDistance)) {
   yTickDistanceFinal = yTickDistanceFinal * 5;
} else if (Math.abs(yTickDistanceFinal / 5 - yTickDistance) < Math.abs(yTickDistanceFinal - yTickDistance)) {
   yTickDistanceFinal = yTickDistanceFinal / 5;
}
var yTicks = [];
for (var v = minValue + yTickDistanceFinal; v < maxValue; v += yTickDistanceFinal) {
  var t = Math.round(Math.floor(v / yTickDistanceFinal)*yTickDistanceFinal);
  if (t == 0) continue;
  yTicks.push(t);
}
var chartMods = d3.select("#chartMods");
chartMods.selectAll(".axis").remove();
chartMods.append("g")
    .attr("class", "axis")
    .attr("transform", "translate("+chartXPadding+",0)")
    .call(d3.axisRight(yScale).tickValues(yTicks).tickSizeOuter(0));
var xAxis = chartMods.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,"+(yScale(0))+")")
    .call(d3.axisTop(xScale)/*.tickValues(xTicks)*/);
   xAxis.node().removeChild(xAxis.node().lastChild);
   xAxis.node().removeChild(xAxis.node().children.item(xAxis.node().children.length-2));
   var lastText = d3.select(xAxis.select(".tick").node().parentNode.lastChild).select("text");
   lastText.html("<a href=\"javascript:decEndDate();\" cursor=\"pointer\"><<</a> " + lastText.html() + " <a href=\"javascript:incEndDate();\" cursor=\"pointer\">>></a>");
   
   var chartMods = d3.select("#chartMods").selectAll(".chartMod").data(getAllMods());
   chartMods.exit().remove();
   var newChartMods = chartMods.enter().append("g").attr("class", "chartMod");
   yAdj = function(m, i) {
     var adj = -(i%3+1)*2;
	 return adj + "em";
   };
   newChartMods.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", yAdj).attr("class", "modLine");
   newChartMods.append("text").attr("x", 0).attr("y", yAdj);
   
   var allChartMods = newChartMods.merge(chartMods);
   allChartMods.attr("style", function(m) { return m[1].disabled ? "display:none" : null; });
   allChartMods.attr("transform", function(m) { return "translate(" + xScale(m[0]) + ", " + yScale(0) + ")"; });
   allChartMods.select("text").text(function(m) { return m[1].name; });
}

refreshChart();
