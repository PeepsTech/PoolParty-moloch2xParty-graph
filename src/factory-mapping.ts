import { BigInt, log, Address, Bytes } from "@graphprotocol/graph-ts";
import { PartyStarted } from "../generated/MolochSummoner/V2Factory";

import { MolochTemplate } from "../generated/templates";
import { Moloch } from "../generated/schema";
import { createAndApproveToken, createEscrowTokenBalance, createGuildTokenBalance, createAndAddSummoner} from "./v2-mapping"


export function handleSummoned(event: PartyStarted): void {
  
  MolochTemplate.create(event.params.pty);

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  let GUILD = Address.fromString("0x000000000000000000000000000000000000beef");

  let molochId = event.params.pty.toHex();
  let moloch = new Moloch(molochId);

  let tokens = event.params._approvedTokens;
  let approvedTokens: string[] = [];

  let escrowTokenBalance: string[] = [];
  let guildTokenBalance: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    approvedTokens.push(createAndApproveToken(molochId, token));
    escrowTokenBalance.push(createEscrowTokenBalance(molochId, token));
    guildTokenBalance.push(createGuildTokenBalance(molochId, token));
  }

  moloch.depositToken = approvedTokens[0];
  moloch.idleToken = approvedTokens[1];

  let eventFounders = event.params._founders;
  let founders: string[] = [];

  for (let i = 0; i < eventFounders.length; i++) {
    let founder = eventFounders[i];
      founders.push(
        createAndAddSummoner(molochId, founder, event)
      );
    }
  

  moloch.founders = founders;
  log.info('Moloch founders are: {}', [moloch.founders.toString()])
  // @DEV - need to figure out a way to save this array of numbers, having issues with types and type conversions 
  //moloch.summonerShares = summonerShares;
  moloch.summoningTime = event.params.summoningTime;
  moloch.version = "2xParty";
  moloch.partyAddress = event.params.pty;
  moloch.deleted = false;
  moloch.newContract = "1";
  moloch.depositRate = event.params._depositRate;
  moloch.partyGoal = event.params._partyGoal;
  moloch.periodDuration = event.params._periodDuration;
  log.info('Moloch period duration is: {}', [moloch.periodDuration.toString()])
  moloch.votingPeriodLength = event.params._votingPeriodLength;
  moloch.gracePeriodLength = event.params._gracePeriodLength;
  moloch.proposalDepositReward = event.params._proposalDepositReward;
  moloch.dilutionBound = BigInt.fromI32(5);
  moloch.approvedTokens = approvedTokens;
  moloch.guildTokenBalance = guildTokenBalance;
  moloch.escrowTokenBalance = escrowTokenBalance;
  moloch.totalShares = BigInt.fromI32(0);
  moloch.totalLoot = BigInt.fromI32(0);
  moloch.totalDeposits = BigInt.fromI32(0);
  moloch.goalHit = false;
  moloch.proposalCount = BigInt.fromI32(0);
  moloch.proposalQueueCount = BigInt.fromI32(0);
  log.info('Moloch proposal queue is: {}', [moloch.proposalQueueCount.toString()])
  moloch.proposedToJoin = new Array<string>();
  moloch.proposedToKick = new Array<string>();
  moloch.proposedToFund = new Array<string>();
  moloch.proposedToTrade = new Array<string>();

  moloch.save();
}