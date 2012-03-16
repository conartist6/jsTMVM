var ultd = "ultd";

function asyncExManager(settings, getRunSpeed, fun, args)
{
    if(args === undefined)args = null;
    this.fun = fun;
    this.args = args;
    this.settings = settings;
    this.getRunSpeed = getRunSpeed;
    
    start = (new Date).getTime();
    for(i=0; i < settings.timingTestIterations; i++) this.fun.apply(null, args);
    diff = (new Date).getTime() - start;
    
    tPerIter = 1.0 * diff / settings.timingTestIterations;
    this.runIterations = settings.responsiveness * 1000 / tPerIter;
    this.timeout = settings.responsiveness / 2 * 1000;
}

asyncExManager.prototype.iterate = function(timerVal)
{
    if(this.startTime + ++this.ticks * this.timeout > this.lastCompleted)
    {
	Document.ignored = 0;
    	var i = 0, res, runSpeed = this.getRunSpeed();
	while((res = this.fun.apply(null, this.args)), i < this.runIterations)
	{
	    if(runSpeed != ultd || !res)
	    {
		this.clock = clearInterval(this.clock);
		if(res)this.defer.resolve(); //Allow continued stepped execution.
		else this.defer.reject(); //Stop the execution chain!
		return;
	    }
	    i++;
	}
	completed = (new Date).getTime();
	console.log("Run time: "+ (completed - this.lastCompleted) +" for "+this.runIterations+" iterations.");
	this.lastCompleted = completed;
    }
    else Document.ignored++;
}

asyncExManager.prototype.start = function()
{
    var self = this;
    if(this.fun)
    {
	this.ticks = 0, this.lastCompleted = this.startTime = (new Date).getTime();
	//this.clock = setInterval(_.bind(this.iterate, this), this.timeout);
	this.clock = setInterval(function(){self.iterate.apply(self, self.args)}, this.timeout);

	this.defer = $.Deferred();
	return this.defer;
    }
    else
    {
	alert("uninitialized asyncExManager started!");
	return false;
    }
}

function timedStepExManager(getRunSpeed, settings, fun, args)
{
    this.settings = settings, this.getRunSpeed = getRunSpeed, this.fun = fun, this.args = args;
    this.async = new asyncExManager(settings, getRunSpeed, fun, args);
}

timedStepExManager.prototype.step = function(keepStepping)
{
    var runSpeed = this.getRunSpeed();
    if(keepStepping === undefined) keepStepping = false;
    if(this.fun.apply(null, this.args) && keepStepping) //if the halting condition hasn't been reached
    {			      //schedule the next step
	if(runSpeed == ultd)
	{ //When asynchronous execution bails, resume where we left off.
	    var self = this;
	    this.async.start().done(function(){self.step.apply(self, [true]);}); 
	}
	else
	{
	    var self = this;
	    this.clock = setTimeout(function(){self.step.apply(self, [true]);}, 1000 / runSpeed);
	}
    }
}

timedStepExManager.prototype.start = function()
{
    if(this.fun)this.step(true);
    else
    {
	alert("uninitialized timedStepExManager started!");
	return false;
    }
}
timedStepExManager.prototype.stop = function()
{
    if(this.clock) this.clock = clearTimeout(this.clock);
}
