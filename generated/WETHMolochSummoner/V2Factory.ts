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

  get pty(): Address {
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

  get summoningTime(): BigInt {
    return this._event.parameters[10].value.toBigInt();
  }
}

export class V2Factory extends SmartContract {
  static bind(address: Address): V2Factory {
    return new V2Factory("V2Factory", address);
  }

  startParty(
    _founders: Array<Address>,
    _approvedTokens: Array<Address>,
    _daoFees: Address,
    _periodDuration: BigInt,
    _votingPeriodLength: BigInt,
    _gracePeriodLength: BigInt,
    _proposalDepositReward: BigInt,
    _depositRate: BigInt,
    _partyGoal: BigInt,
    _dilutionBound: BigInt
  ): Address {
    let result = super.call("startParty", [
      EthereumValue.fromAddressArray(_founders),
      EthereumValue.fromAddressArray(_approvedTokens),
      EthereumValue.fromAddress(_daoFees),
      EthereumValue.fromUnsignedBigInt(_periodDuration),
      EthereumValue.fromUnsignedBigInt(_votingPeriodLength),
      EthereumValue.fromUnsignedBigInt(_gracePeriodLength),
      EthereumValue.fromUnsignedBigInt(_proposalDepositReward),
      EthereumValue.fromUnsignedBigInt(_depositRate),
      EthereumValue.fromUnsignedBigInt(_partyGoal),
      EthereumValue.fromUnsignedBigInt(_dilutionBound)
    ]);

    return result[0].toAddress();
  }

  try_startParty(
    _founders: Array<Address>,
    _approvedTokens: Array<Address>,
    _daoFees: Address,
    _periodDuration: BigInt,
    _votingPeriodLength: BigInt,
    _gracePeriodLength: BigInt,
    _proposalDepositReward: BigInt,
    _depositRate: BigInt,
    _partyGoal: BigInt,
    _dilutionBound: BigInt
  ): CallResult<Address> {
    let result = super.tryCall("startParty", [
      EthereumValue.fromAddressArray(_founders),
      EthereumValue.fromAddressArray(_approvedTokens),
      EthereumValue.fromAddress(_daoFees),
      EthereumValue.fromUnsignedBigInt(_periodDuration),
      EthereumValue.fromUnsignedBigInt(_votingPeriodLength),
      EthereumValue.fromUnsignedBigInt(_gracePeriodLength),
      EthereumValue.fromUnsignedBigInt(_proposalDepositReward),
      EthereumValue.fromUnsignedBigInt(_depositRate),
      EthereumValue.fromUnsignedBigInt(_partyGoal),
      EthereumValue.fromUnsignedBigInt(_dilutionBound)
    ]);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }

  template(): Address {
    let result = super.call("template", []);

    return result[0].toAddress();
  }

  try_template(): CallResult<Address> {
    let result = super.tryCall("template", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends EthereumCall {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _template(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
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

  get _dilutionBound(): BigInt {
    return this._call.inputValues[9].value.toBigInt();
  }
}

export class StartPartyCall__Outputs {
  _call: StartPartyCall;

  constructor(call: StartPartyCall) {
    this._call = call;
  }

  get value0(): Address {
    return this._call.outputValues[0].value.toAddress();
  }
}