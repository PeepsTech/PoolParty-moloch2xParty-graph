// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  EthereumCall,
  EthereumEvent,
  SmartContract,
  EthereumValue,
  JSONValue,
  TypedMap,
  Entity,
  EthereumTuple,
  Bytes,
  Address,
  BigInt,
  CallResult
} from "@graphprotocol/graph-ts";

export class PartyStarted extends EthereumEvent {
  get params(): PartyStarted__Params {
    return new PartyStarted__Params(this);
  }
}

export class PartyStarted__Params {
  _event: PartyStarted;

  constructor(event: PartyStarted) {
    this._event = event;
  }

  get party(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _founders(): Array<Address> {
    return this._event.parameters[1].value.toAddressArray();
  }

  get _approvedTokens(): Array<Address> {
    return this._event.parameters[2].value.toAddressArray();
  }

  get _daoFees(): Address {
    return this._event.parameters[3].value.toAddress();
  }

  get _periodDuration(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get _votingPeriodLength(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }

  get _gracePeriodLength(): BigInt {
    return this._event.parameters[6].value.toBigInt();
  }

  get _proposalDepositReward(): BigInt {
    return this._event.parameters[7].value.toBigInt();
  }

  get _depositRate(): BigInt {
    return this._event.parameters[8].value.toBigInt();
  }

  get _partyGoal(): BigInt {
    return this._event.parameters[9].value.toBigInt();
  }

  get _name(): Bytes {
    return this._event.parameters[10].value.toBytes();
  }

  get _desc(): Bytes {
    return this._event.parameters[11].value.toBytes();
  }

  get summoningTime(): BigInt {
    return this._event.parameters[12].value.toBigInt();
  }
}

export class V2Factory extends SmartContract {
  static bind(address: Address): V2Factory {
    return new V2Factory("V2Factory", address);
  }

  party(): Address {
    let result = super.call("party", []);

    return result[0].toAddress();
  }

  try_party(): CallResult<Address> {
    let result = super.tryCall("party", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }
}

export class StartPartyCall extends EthereumCall {
  get inputs(): StartPartyCall__Inputs {
    return new StartPartyCall__Inputs(this);
  }

  get outputs(): StartPartyCall__Outputs {
    return new StartPartyCall__Outputs(this);
  }
}

export class StartPartyCall__Inputs {
  _call: StartPartyCall;

  constructor(call: StartPartyCall) {
    this._call = call;
  }

  get _founders(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }

  get _approvedTokens(): Array<Address> {
    return this._call.inputValues[1].value.toAddressArray();
  }

  get _daoFees(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _periodDuration(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get _votingPeriodLength(): BigInt {
    return this._call.inputValues[4].value.toBigInt();
  }

  get _gracePeriodLength(): BigInt {
    return this._call.inputValues[5].value.toBigInt();
  }

  get _proposalDepositReward(): BigInt {
    return this._call.inputValues[6].value.toBigInt();
  }

  get _depositRate(): BigInt {
    return this._call.inputValues[7].value.toBigInt();
  }

  get _partyGoal(): BigInt {
    return this._call.inputValues[8].value.toBigInt();
  }

  get _name(): Bytes {
    return this._call.inputValues[9].value.toBytes();
  }

  get _desc(): Bytes {
    return this._call.inputValues[10].value.toBytes();
  }
}

export class StartPartyCall__Outputs {
  _call: StartPartyCall;

  constructor(call: StartPartyCall) {
    this._call = call;
  }
}
