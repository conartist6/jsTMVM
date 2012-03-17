var ultd = "ultd";

function asyncExManager(settings, getRunSpeed, fun, args)
{
    if(args === undefined)args = null;
    this.fun = fun, this.args = args, this.settings = settings, this.getRunSpeed = getRunSpeed;
    
    start = (new Date).getTime();
    for(var i=0; i < settings.timingTestIterations; i++) this.fun.apply(null, args);
    diff = (new Date).getTime() - start;
    
    tPerIter = 1.0 * diff / settings.timingTestIterations;
    this.runIterations = settings.responsiveness * 1000 / tPerIter;
}

asyncExManager.prototype.iterate = function(timerVal)
{
    	var i = 0, res, runSpeed = this.getRunSpeed();
	while((res = this.fun.apply(null, this.args)), i++ < this.runIterations)
	{
	    if(runSpeed != ultd || !res)
	    {
		if(res)this.defer.resolve(); //Allow continued stepped execution.
		else this.defer.reject(); //Stop the execution chain!
		return;
	    }
	}
	setTimeout(_.bind(this.iterate, this),0);
}

asyncExManager.prototype.start = function()
{
    if(this.fun)
    {
	setTimeout(_.bind(this.iterate, this), 0);
	this.defer = $.Deferred();
	return this.defer;
    }
    else { alert("Uninitialized asyncExManager started!"); return false; }
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
    if(!this.fun.apply(null, this.args) || !keepStepping) return; //if the halting condition hasn't been reached

    //when stepped execution becomes async, set up to step again if execution stops being async.
    if(runSpeed == ultd) this.async.start().done(_.bind(this.step, this, true)); 
    else this.clock = setTimeout(_.bind(this.step, this, true), 1000 / runSpeed);
}

timedStepExManager.prototype.start = function()
{
    if(this.fun)this.step(true);
    else {alert("uninitialized timedStepExManager started!"); return false; }
}
timedStepExManager.prototype.stop = function()
{
    if(this.clock) this.clock = clearTimeout(this.clock);
}
