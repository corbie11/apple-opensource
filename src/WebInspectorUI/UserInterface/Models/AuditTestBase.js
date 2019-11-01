/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.AuditTestBase = class AuditTestBase extends WI.Object
{
    constructor(name, {description} = {})
    {
        console.assert(typeof name === "string");
        console.assert(!description || typeof description === "string");

        super();

        this._name = name;
        this._description = description || null;

        this._runningState = WI.AuditManager.RunningState.Inactive;
        this._result = null;
    }

    // Public

    get name() { return this._name; }
    get description() { return this._description; }
    get runningState() { return this._runningState; }
    get result() { return this._result; }

    async start()
    {
        // Called from WI.AuditManager.

        console.assert(WI.auditManager.runningState === WI.AuditManager.RunningState.Active);

        console.assert(this._runningState === WI.AuditManager.RunningState.Inactive);
        if (this._runningState !== WI.AuditManager.RunningState.Inactive)
            return;

        this._runningState = WI.AuditManager.RunningState.Active;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Scheduled);

        await this.run();

        this._runningState = WI.AuditManager.RunningState.Inactive;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Completed);
    }

    stop()
    {
        // Called from WI.AuditManager.

        console.assert(this._runningState !== WI.AuditManager.RunningState.Inactive);

        if (this._runningState !== WI.AuditManager.RunningState.Active)
            return;

        this._runningState = WI.AuditManager.RunningState.Stopping;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Stopping);
    }

    clearResult(options = {})
    {
        if (!this._result)
            return false;

        this._result = null;

        if (!options.suppressResultClearedEvent)
            this.dispatchEventToListeners(WI.AuditTestBase.Event.ResultCleared);

        return true;
    }

    saveIdentityToCookie(cookie)
    {
        cookie["audit-" + this.constructor.TypeIdentifier + "-name"] = this._name;
    }

    toJSON()
    {
        let json = {
            type: this.constructor.TypeIdentifier,
            name: this._name,
        };
        if (this._description)
            json.description = this._description;
        return json;
    }

    // Protected

    async run()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }
};

WI.AuditTestBase.Event = {
    Completed: "audit-test-base-completed",
    Progress: "audit-test-base-progress",
    ResultCleared: "audit-test-base-result-cleared",
    Scheduled: "audit-test-base-scheduled",
    Stopping: "audit-test-base-stopping",
};