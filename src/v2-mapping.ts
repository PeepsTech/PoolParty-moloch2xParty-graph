import { BigInt, log, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  ProcessAmendGovernance,
  MakeDeposit,
  SubmitProposal,
  SubmitVote,
  ProcessProposal,
  SponsorProposal,
  ProcessIdleProposal,
  ProcessGuildKickProposal,
  Ragequit,
  CancelProposal,
  Withdraw,
  TokensCollected,
  WithdrawEarnings,
} from "../generated/templates/MolochTemplate/V2Moloch";
import { Erc20 } from "../generated/templates/MolochTemplate/Erc20";
import { Erc20Bytes32 } from "../generated/templates/MolochTemplate/Erc20Bytes32";
import { PartyStarted } from "../generated/MolochSummoner/V2Factory";

import {
  Moloch,
  Member,
  Token,
  TokenBalance,
  Proposal,
  Vote,
  RageQuit,
} from "../generated/schema";
import {
  addVotedBadge,
  addRageQuitBadge,
  addJailedCountBadge,
  addProposalSubmissionBadge,
  addProposalSponsorBadge,
  addMembershipBadge,
  addProposalProcessorBadge,
} from "./badges";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let ESCROW = Address.fromString("0x000000000000000000000000000000000000dead");
let GUILD = Address.fromString("0x000000000000000000000000000000000000beef");

function loadOrCreateTokenBalance(
  molochId: string,
  member: Bytes,
  token: string
): TokenBalance | null {
  let memberTokenBalanceId = token.concat("-member-").concat(member.toHex());
  let tokenBalance = TokenBalance.load(memberTokenBalanceId);
  let tokenBalanceDNE = tokenBalance == null ? true : false;
  if (tokenBalanceDNE) {
    createMemberTokenBalance(molochId, member, token, BigInt.fromI32(0));
    return TokenBalance.load(memberTokenBalanceId);
  } else {
    return tokenBalance;
  }
}
function addToBalance(
  molochId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let tokenBalanceId = token.concat("-member-").concat(member.toHex());
  let balance: TokenBalance | null = loadOrCreateTokenBalance(
    molochId,
    member,
    token
  );
  balance.tokenBalance = balance.tokenBalance.plus(amount);
  balance.save();
  return tokenBalanceId;
}
function subtractFromBalance(
  molochId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let tokenBalanceId = token.concat("-member-").concat(member.toHex());
  let balance: TokenBalance | null = loadOrCreateTokenBalance(
    molochId,
    member,
    token
  );
  balance.tokenBalance = balance.tokenBalance.minus(amount);
  balance.save();
  return tokenBalanceId;
}

function internalTransfer(
  molochId: string,
  from: Bytes,
  to: Bytes,
  token: string,
  amount: BigInt
): void {
  subtractFromBalance(molochId, from, token, amount);
  addToBalance(molochId, to, token, amount);
}

export function createMemberTokenBalance(
  molochId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let memberId = molochId.concat("-member-").concat(member.toHex());
  let memberTokenBalanceId = token.concat("-member-").concat(member.toHex());
  let memberTokenBalance = new TokenBalance(memberTokenBalanceId);

  memberTokenBalance.moloch = molochId;
  memberTokenBalance.token = token;
  memberTokenBalance.tokenBalance = amount;
  memberTokenBalance.member = memberId;
  memberTokenBalance.guildBank = false;
  memberTokenBalance.ecrowBank = false;
  memberTokenBalance.memberBank = true;

  memberTokenBalance.save();
  return memberTokenBalanceId;
}

export function createEscrowTokenBalance(
  molochId: string,
  token: Bytes
): string {
  let memberId = molochId.concat("-member-").concat(ESCROW.toHex());
  let tokenId = molochId.concat("-token-").concat(token.toHex());
  let escrowTokenBalanceId = tokenId.concat("-member-").concat(ESCROW.toHex());
  let escrowTokenBalance = new TokenBalance(escrowTokenBalanceId);
  escrowTokenBalance.moloch = molochId;
  escrowTokenBalance.token = tokenId;
  escrowTokenBalance.tokenBalance = BigInt.fromI32(0);
  escrowTokenBalance.member = memberId;
  escrowTokenBalance.guildBank = false;
  escrowTokenBalance.ecrowBank = true;
  escrowTokenBalance.memberBank = false;

  escrowTokenBalance.save();
  return escrowTokenBalanceId;
}

export function createGuildTokenBalance(
  molochId: string,
  token: Bytes
): string {
  let memberId = molochId.concat("-member-").concat(GUILD.toHex());
  let tokenId = molochId.concat("-token-").concat(token.toHex());
  let guildTokenBalanceId = tokenId.concat("-member-").concat(GUILD.toHex());
  let guildTokenBalance = new TokenBalance(guildTokenBalanceId);

  guildTokenBalance.moloch = molochId;
  guildTokenBalance.token = tokenId;
  guildTokenBalance.tokenBalance = BigInt.fromI32(0);
  guildTokenBalance.member = memberId;
  guildTokenBalance.guildBank = true;
  guildTokenBalance.ecrowBank = false;
  guildTokenBalance.memberBank = false;

  guildTokenBalance.save();
  return guildTokenBalanceId;
}
export function createAndApproveToken(molochId: string, token: Bytes): string {
  let tokenId = molochId.concat("-token-").concat(token.toHex());
  let createToken = new Token(tokenId);

  createToken.moloch = molochId;
  createToken.tokenAddress = token;
  createToken.whitelisted = true;

  let erc20 = Erc20.bind(token as Address);
  let symbol = erc20.try_symbol();
  if (symbol.reverted) {
    log.info("symbol reverted molochId {}, token, {}", [
      molochId,
      token.toHexString(),
    ]);

    let erc20Bytes32 = Erc20Bytes32.bind(token as Address);
    let otherSymbol = erc20Bytes32.try_symbol();
    if (otherSymbol.reverted) {
      log.info("other symbol reverted molochId {}, token, {}", [
        molochId,
        token.toHexString(),
      ]);
    } else {
      createToken.symbol = otherSymbol.value.toString();
    }
  } else {
    createToken.symbol = symbol.value;
  }

  let decimals = erc20.try_decimals();
  if (decimals.reverted) {
    log.info("decimals reverted molochId {}, token, {}", [
      molochId,
      token.toHexString(),
    ]);
  } else {
    createToken.decimals = BigInt.fromI32(decimals.value);
  }

  createToken.save();
  return tokenId;
}

// used to create multiple summoners at time of summoning
export function createAndAddSummoner(
  molochId: string,
  founder: Address,
  event: PartyStarted,
): string {

  let memberId = molochId.concat("-member-").concat(founder.toHex());
  log.info('My MolochId is: {}', [molochId])
  let member = new Member(memberId);
  log.info('My memberId is: {}', [memberId])
  

  member.moloch = molochId;
  log.info('My moloch is: {}', [molochId])
  member.createdAt = event.block.timestamp.toString();
  member.molochAddress = event.params.party;
  member.memberAddress = founder;
  member.shares = BigInt.fromI32(0);
  member.loot = BigInt.fromI32(0);
  member.tokenTribute = BigInt.fromI32(0);
  member.iTokenAmts = BigInt.fromI32(0);
  member.iTokenRedemptions = BigInt.fromI32(0);
  member.didRagequit = false;
  member.exists = true;
  member.proposedToKick = false;
  member.kicked = false;

  //Set summoner summoner balances for approved tokens to zero
   let tokens = event.params._approvedTokens;
   
   for (let i = 0; i < tokens.length; i++) {
     let token = tokens[i];
     log.info('My token is: {}', [token.toHex()])
     let tokenId = molochId.concat("-token-").concat(token.toHex());
     createMemberTokenBalance(
       molochId,
       founder,
       tokenId,
       BigInt.fromI32(0)
     );
   }
  
  member.save();

  addMembershipBadge(founder);

  return memberId;
}

export function handleMakeDeposit(event: MakeDeposit): void {
  let molochId = event.address.toHexString();
  let member = Member.load(
    molochId.concat("-member-").concat(event.params.memberAddress.toHex())
  );
  //load moloch to get idleToken
  let moloch = Moloch.load(molochId);

  //update member token tribute, iToken balances, and shares
  let idleTokenID = moloch.idleToken;
  let tribute = event.params.tribute;
  let mintedTokens = event.params.mintedTokens;
  
  member.tokenTribute = tribute;
  member.iTokenAmts = member.iTokenAmts.plus(mintedTokens);
  member.shares = member.shares.plus(event.params.shares);
  member.save();

  //update moloch
  let totalDeposits = moloch.totalDeposits;
  let goalHit = event.params.goalHit;

  moloch.totalShares = moloch.totalShares.plus(event.params.shares);
  moloch.idleAvgCost = event.params.idleAvgCost;
  moloch.totalDeposits = totalDeposits.plus(tribute);

  if(goalHit == 1){
    moloch.goalHit = true;
  }

  moloch.save();

  //GUILD w/ tribute
  addToBalance(molochId, GUILD, idleTokenID, mintedTokens);
}


export function handleSubmitProposal(event: SubmitProposal): void {
  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let newProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let memberId = molochId
    .concat("-member-")
    .concat(event.params.memberAddress.toHex());

  let member = Member.load(
    molochId.concat("-member-").concat(event.params.applicant.toHex())
  );
  let noMember = member == null || member.exists == false;
  let newMember = noMember && event.params.sharesRequested > BigInt.fromI32(0);

  // For trades, members deposit tribute in the token they want to sell to the dao, and request payment in the token they wish to receive.
  let trade =
    event.params.paymentToken != Address.fromI32(0) &&
    event.params.tributeToken != Address.fromI32(0) &&
    event.params.tributeOffered > BigInt.fromI32(0) &&
    event.params.paymentRequested > BigInt.fromI32(0);

  let flags = event.params.flags;

  let proposal = new Proposal(newProposalId);
  proposal.proposalId = event.params.proposalId;

  proposal.moloch = molochId;
  proposal.molochAddress = event.address;
  proposal.createdAt = event.block.timestamp.toString();
  proposal.member = memberId;
  proposal.memberAddress = event.params.memberAddress;
  proposal.applicant = event.params.applicant;
  proposal.proposer = event.transaction.from;
  proposal.sponsor = Address.fromString(ZERO_ADDRESS);
  proposal.sharesRequested = event.params.sharesRequested;
  proposal.lootRequested = event.params.lootRequested;
  proposal.tributeOffered = event.params.tributeOffered;
  proposal.tributeToken = event.params.tributeToken;
  proposal.paymentRequested = event.params.paymentRequested;
  proposal.paymentToken = event.params.paymentToken;
  proposal.startingPeriod = BigInt.fromI32(0);
  proposal.yesVotes = BigInt.fromI32(0);
  proposal.noVotes = BigInt.fromI32(0);
  proposal.sponsored = flags[0]
  proposal.processed = flags[1];
  proposal.didPass = flags[2];
  proposal.cancelled = flags[3];
  proposal.guildkick = flags[4];
  proposal.spending = flags[5];
  proposal.addMember = flags[6];
  proposal.governance = flags[7];
  proposal.newMember = newMember;
  proposal.trade = trade;
  proposal.yesShares = BigInt.fromI32(0);
  proposal.noShares = BigInt.fromI32(0);
  proposal.maxTotalSharesAndLootAtYesVote = BigInt.fromI32(0);
  proposal.details = event.params.details;

  //take deposit and move to ESCROW
  addToBalance(molochId, ESCROW, moloch.depositToken, moloch.proposalDepositReward);

  proposal.save();

  addProposalSubmissionBadge(event.transaction.from, event.transaction);

  // collect tribute from proposer and store it in Moloch ESCROW until the proposal is processed
  if (event.params.tributeOffered > BigInt.fromI32(0)) {
    let tokenId = molochId
      .concat("-token-")
      .concat(event.params.tributeToken.toHex());
    addToBalance(molochId, ESCROW, tokenId, event.params.tributeOffered);
  }
}

export function handleSponsorProposal(event: SponsorProposal): void {
  let molochId = event.address.toHexString();
  let memberId = molochId
    .concat("-member-")
    .concat(event.params.memberAddress.toHex());
  let sponsorProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());

  log.info("***** sponsorProposal {}", [sponsorProposalId]);

  let moloch = Moloch.load(molochId);

  let proposal = Proposal.load(sponsorProposalId);

  if (proposal.newMember) {
    moloch.proposedToJoin = moloch.proposedToJoin.concat([sponsorProposalId]);
    moloch.save();
  } else if (proposal.guildkick) {
    moloch.proposedToKick = moloch.proposedToKick.concat([sponsorProposalId]);
    let member = Member.load(memberId);
    member.proposedToKick = true;
    member.save();
    moloch.save();
  } else if (proposal.trade) {
    moloch.proposedToTrade = moloch.proposedToTrade.concat([sponsorProposalId]);
    moloch.save();
  } else {
    moloch.proposedToFund = moloch.proposedToFund.concat([sponsorProposalId]);
    moloch.save();
  }

  proposal.proposalIndex = event.params.proposalIndex;
  proposal.sponsor = event.params.memberAddress;
  proposal.sponsoredAt = event.block.timestamp.toString();
  proposal.startingPeriod = event.params.startingPeriod;
  proposal.sponsored = true;

  // calculate times
  let votingPeriodStarts = moloch.summoningTime.plus(
    proposal.startingPeriod.times(moloch.periodDuration)
  );
  let votingPeriodEnds = votingPeriodStarts.plus(
    moloch.votingPeriodLength.times(moloch.periodDuration)
  );
  let gracePeriodEnds = votingPeriodEnds.plus(
    moloch.gracePeriodLength.times(moloch.periodDuration)
  );

  proposal.votingPeriodStarts = votingPeriodStarts;
  proposal.votingPeriodEnds = votingPeriodEnds;
  proposal.gracePeriodEnds = gracePeriodEnds;

  proposal.save();

  addProposalSponsorBadge(event.params.memberAddress, event.transaction);
}

export function handleSubmitVote(event: SubmitVote): void {
  let molochId = event.address.toHexString();
  let memberId = molochId
    .concat("-member-")
    .concat(event.params.memberAddress.toHex());
  let proposalVotedId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let voteId = memberId
    .concat("-vote-")
    .concat(event.params.proposalId.toString());

  let vote = new Vote(voteId);

  vote.createdAt = event.block.timestamp.toString();
  vote.proposal = proposalVotedId;
  vote.member = memberId;
  vote.memberAddress = event.params.memberAddress;
  vote.molochAddress = event.address;
  vote.uintVote = event.params.uintVote;

  vote.save();

  addVotedBadge(
    event.params.memberAddress,
    event.params.uintVote,
    event.transaction
  );

  let moloch = Moloch.load(molochId);
  let proposal = Proposal.load(proposalVotedId);
  let member = Member.load(memberId);

  switch (event.params.uintVote) {
    case 1: {
      //NOTE: Vote.yes
      proposal.yesShares = proposal.yesShares.plus(member.shares);
      proposal.yesVotes = proposal.yesVotes.plus(BigInt.fromI32(1));
      //NOTE: Set maximum of total shares encountered at a yes vote - used to bound dilution for yes voters

      proposal.maxTotalSharesAndLootAtYesVote = moloch.totalLoot.plus(
        moloch.totalShares
      );
      //NOTE: Set highest index (latest) yes vote - must be processed for member to ragequit
      member.highestIndexYesVote = proposalVotedId;
      proposal.save();
      member.save();
      break;
    }
    case 2: {
      proposal.noShares = proposal.noShares.plus(member.shares);
      proposal.noVotes = proposal.noVotes.plus(BigInt.fromI32(1));
      proposal.save();
      break;
    }
    default: {
      //TODO: LOG AN ERROR, SHOULD BE A DEAD END CHECK uintVote INVARIANT IN CONTRACT
      break;
    }
  }
}

export function handleProcessProposal(event: ProcessProposal): void {
  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let processProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let proposal = Proposal.load(processProposalId);

  let applicantId = molochId
    .concat("-member-")
    .concat(proposal.applicant.toHex());
  let member = Member.load(applicantId);

  let tributeTokenId = molochId
    .concat("-token-")
    .concat(proposal.tributeToken.toHex());
  let paymentTokenId = molochId
    .concat("-token-")
    .concat(proposal.paymentToken.toHex());

  let isNewMember = member != null && member.exists == true ? false : true;

  addProposalProcessorBadge(event.transaction.from, event.transaction);

  //NOTE: PROPOSAL PASSED
  if (event.params.didPass) {
    proposal.didPass = true;

    //CREATE MEMBER
    if (isNewMember) {
      // if member.exists == false the member entity already exists
      // because it was created in cancelProposal for a cancelled new member proposal
      let newMember = member;

      if (newMember == null) {
        newMember = new Member(applicantId);
      }

      newMember.moloch = molochId;
      newMember.createdAt = event.block.timestamp.toString();
      newMember.molochAddress = event.address;
      newMember.memberAddress = proposal.applicant;

      // Account for shares being captured by the MakeDeposit, if tribute is depositToken
      if(proposal.tributeToken.toHex() == moloch.depositToken){
        newMember.shares = BigInt.fromI32(0);
      } else {
        newMember.shares = proposal.sharesRequested;
      }
      
      newMember.loot = proposal.lootRequested;

      if (proposal.sharesRequested > BigInt.fromI32(0)) {
        newMember.exists = true;
      } else {
        newMember.exists = false;
      }

      newMember.tokenTribute = BigInt.fromI32(0);
      newMember.didRagequit = false;
      newMember.proposedToKick = false;
      newMember.kicked = false;
      newMember.iTokenAmts = BigInt.fromI32(0);
      newMember.iTokenRedemptions = BigInt.fromI32(0);

      newMember.save();

      addMembershipBadge(proposal.applicant);

      //FUND PROPOSAL
    } else {
      member.shares = member.shares.plus(proposal.sharesRequested);
      member.loot = member.loot.plus(proposal.lootRequested);
      member.save();
    }

    //NOTE: Add shares/loot do intake tribute from escrow, payout from guild bank
    moloch.totalShares = moloch.totalShares.plus(proposal.sharesRequested);
    moloch.totalLoot = moloch.totalLoot.plus(proposal.lootRequested);
    if(proposal.tributeToken.toHex() == moloch.depositToken){
      subtractFromBalance(
        molochId,
        ESCROW,
        tributeTokenId,
        proposal.tributeOffered
      );
    } else {
      internalTransfer(
        molochId,
        ESCROW,
        GUILD,
        tributeTokenId,
        proposal.tributeOffered
      );
    }

    //NOTE: check if user has a tokenBalance for that token if not then create one before sending
    if(proposal.paymentToken.toHex() != moloch.depositToken) {
      internalTransfer(
        molochId,
        GUILD,
        proposal.applicant,
        paymentTokenId,
        proposal.paymentRequested
      );
    }
    //NOTE: PROPOSAL FAILED
  } else {
    proposal.didPass = false;
    // return all tokens to the applicant

    // create a member entity if needed for withdraw
    if (isNewMember) {
      let newMember = new Member(applicantId);

      newMember.moloch = molochId;
      newMember.createdAt = event.block.timestamp.toString();
      newMember.molochAddress = event.address;
      newMember.memberAddress = proposal.applicant;
      newMember.shares = BigInt.fromI32(0);
      newMember.loot = BigInt.fromI32(0);
      newMember.exists = false;
      newMember.tokenTribute = BigInt.fromI32(0);
      newMember.didRagequit = false;
      newMember.proposedToKick = false;
      newMember.kicked = false;

      newMember.save();
    }

    internalTransfer(
      molochId,
      ESCROW,
      proposal.applicant,
      tributeTokenId,
      proposal.tributeOffered
    );
  }

  //NOTE: fixed array comprehensions update ongoing proposals (that have been sponsored)
  if (proposal.trade) {
    moloch.proposedToTrade = moloch.proposedToTrade.filter(function(
      value,
      index,
      arr
    ) {
      return index > 0;
    });
  } else if (proposal.newMember) {
    moloch.proposedToJoin = moloch.proposedToJoin.filter(function(
      value,
      index,
      arr
    ) {
      return index > 0;
    });
  } else {
    moloch.proposedToFund = moloch.proposedToFund.filter(function(
      value,
      index,
      arr
    ) {
      return index > 0;
    });
  }
  proposal.processed = true;

  internalTransfer(
    molochId,
    ESCROW,
    event.transaction.from,
    moloch.depositToken,
    moloch.proposalDepositReward
  );
  
  moloch.save();
  proposal.save();
}

export function handleIdleProposal(event: ProcessIdleProposal): void {

  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let processProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());

  let proposal = Proposal.load(processProposalId);
  
  let paymentTokenId = molochId
  .concat("-proposal-")
  .concat(proposal.paymentToken.toHex());

  let depositTokenId = molochId
  .concat("-proposal-")
  .concat(moloch.depositToken);

  subtractFromBalance(
    molochId,
    GUILD,
    paymentTokenId,
    event.params.idleRedemptionAmt
  );
  addToBalance(
    molochId,
    GUILD,
    depositTokenId,
    event.params.depositTokenAmt
  );
  internalTransfer(
    molochId,
    GUILD,
    proposal.applicant,
    depositTokenId,
    event.params.depositTokenAmt
  );
}

export function handleAmendGovernance(event: ProcessAmendGovernance): void {
  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let processProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let proposal = Proposal.load(processProposalId);

  addProposalProcessorBadge(event.transaction.from, event.transaction);

  // Adds new token to tokenWhitelist
  let newApprToken = proposal.tributeToken.toHex();
  let newIdleToken = proposal.paymentToken.toHex();


  if (event.params.didPass) {
    proposal.didPass = true;
    //Update moloch governance
    if (proposal.governance) {
        moloch.partyGoal = proposal.tributeOffered;
        moloch.depositRate = proposal.paymentRequested;

        if(newIdleToken != ZERO_ADDRESS){
          moloch.idleToken = newIdleToken
        }
        
        if(newApprToken != ZERO_ADDRESS){
  
          let approvedTokens = moloch.approvedTokens;
          approvedTokens.push(
            createAndApproveToken(molochId, proposal.tributeToken)
          );
          moloch.approvedTokens = approvedTokens;
      
          let escrowTokens = moloch.escrowTokenBalance;
          escrowTokens.push(
            createEscrowTokenBalance(molochId, proposal.tributeToken)
          );
          moloch.escrowTokenBalance = escrowTokens;
      
          let guildTokens = moloch.guildTokenBalance;
          guildTokens.push(
            createGuildTokenBalance(molochId, proposal.tributeToken)
          );
          moloch.guildTokenBalance = guildTokens;
        }

      moloch.save();
    }
    //PROPOSAL FAILED
  } else {
    proposal.didPass = false;
  }

  //NOTE: can only process proposals in order, test shift array comprehension might have tp sprt first for this to work
  moloch.proposedToAmend = moloch.proposedToAmend.filter(function(
    value,
    index,
    arr
  ) {
    return index > 0;
  });
  proposal.processed = true;

  //NOTE: issue processing reward and return deposit
  //TODO: fix to not use from address, could be a delegate emit member kwy from event
  internalTransfer(
    molochId,
    ESCROW,
    event.transaction.from,
    moloch.depositToken,
    moloch.proposalDepositReward
  );

  proposal.save();
  moloch.save();

}

export function handleProcessGuildKickProposal(
  event: ProcessGuildKickProposal
): void {
  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let processProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let proposal = Proposal.load(processProposalId);

  addProposalProcessorBadge(event.transaction.from, event.transaction);

  //PROPOSAL PASSED
  //NOTE: invariant no loot no shares,
  if (event.params.didPass) {
    proposal.didPass = true;
    //Kick member
    if (proposal.guildkick) {
      let memberId = molochId
        .concat("-member-")
        .concat(proposal.applicant.toHexString());
      let member = Member.load(memberId);
      let newLoot = member.shares;
      member.jailed = true;
      member.kicked = true;
      member.shares = BigInt.fromI32(0);
      member.loot = member.loot.plus(newLoot);
      moloch.totalLoot = moloch.totalLoot.plus(newLoot);
      moloch.totalShares = moloch.totalShares.minus(newLoot);

      member.save();

      addJailedCountBadge(proposal.applicant, event.transaction);
    }
    //PROPOSAL FAILED
  } else {
    proposal.didPass = false;
  }

  //NOTE: can only process proposals in order, test shift array comprehension might have tp sprt first for this to work
  moloch.proposedToKick = moloch.proposedToKick.filter(function(
    value,
    index,
    arr
  ) {
    return index > 0;
  });
  proposal.processed = true;

  //NOTE: issue processing reward and return deposit
  //TODO: fix to not use from address, could be a delegate emit member kwy from event
  internalTransfer(
    molochId,
    ESCROW,
    event.transaction.from,
    moloch.depositToken,
    moloch.proposalDepositReward
  );

  moloch.save();
  proposal.save();
}

export function handleRagequit(event: Ragequit): void {
  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let memberId = molochId
    .concat("-member-")
    .concat(event.params.memberAddress.toHex());
  let member = Member.load(memberId);

  let sharesAndLootToBurn = event.params.sharesToBurn.plus(
    event.params.lootToBurn
  );
  let initialTotalSharesAndLoot = moloch.totalShares.plus(moloch.totalLoot);
  
  let idleToken = moloch.idleToken;

  member.shares = member.shares.minus(event.params.sharesToBurn);
  member.loot = member.loot.minus(event.params.lootToBurn);
  moloch.totalShares = moloch.totalShares.minus(event.params.sharesToBurn);
  moloch.totalLoot = moloch.totalLoot.minus(event.params.lootToBurn);

  // set to doesn't exist if no shares?
  if (member.shares.equals(new BigInt(0))) {
    member.exists = false;
  }

  // for each approved token, calculate the fairshare value and transfer from guildbank to user
  let tokens = moloch.approvedTokens;
  for (let i = 0; i < tokens.length; i++) {
    let token: string = tokens[i];

    let balance: TokenBalance | null = loadOrCreateTokenBalance(
      molochId,
      GUILD,
      token
    );

    let balanceTimesBurn = balance.tokenBalance.times(sharesAndLootToBurn);
    let amountToRageQuit = balanceTimesBurn.div(initialTotalSharesAndLoot);

    internalTransfer(
      molochId,
      GUILD,
      member.memberAddress,
      token,
      amountToRageQuit
    );
    // adjusts for previous iToken redemptions
    let iTokenRed = member.iTokenRedemptions;
    if(iTokenRed > BigInt.fromI32(0)){
      internalTransfer(
        molochId,
        member.memberAddress,
        GUILD,
        idleToken,
        iTokenRed
      );
    }


    //add second internal transfer to adjust for idleTokens
  }

  addRageQuitBadge(event.params.memberAddress, event.transaction);

  member.save();
  moloch.save();

  let rageQuitId = memberId
    .concat("-")
    .concat("rage-")
    .concat(event.block.number.toString());
  let rageQuit = new RageQuit(rageQuitId);
  rageQuit.createdAt = event.block.timestamp.toString();
  rageQuit.moloch = molochId;
  rageQuit.molochAddress = event.address;
  rageQuit.member = memberId;
  rageQuit.memberAddress = event.params.memberAddress;
  rageQuit.shares = event.params.sharesToBurn;
  rageQuit.loot = event.params.lootToBurn;

  rageQuit.save();
}

export function handleCancelProposal(event: CancelProposal): void {
  let molochId = event.address.toHexString();
  let processProposalId = molochId
    .concat("-proposal-")
    .concat(event.params.proposalId.toString());
  let proposal = Proposal.load(processProposalId);

  // Transfer tribute from ESCROW back to the applicant if there was tribute offered on the proposal
  if (proposal.tributeOffered > BigInt.fromI32(0)) {
    let applicantId = molochId
      .concat("-member-")
      .concat(proposal.applicant.toHex());
    let member = Member.load(applicantId);

    // Create a member entity to assign a balance until they widthdraw it. member.exists = false
    if (member == null) {
      let newMember = new Member(applicantId);

      newMember.moloch = molochId;
      newMember.createdAt = event.block.timestamp.toString();
      newMember.molochAddress = event.address;
      newMember.memberAddress = proposal.applicant;
      newMember.shares = BigInt.fromI32(0);
      newMember.loot = proposal.lootRequested;
      newMember.exists = false;
      newMember.tokenTribute = BigInt.fromI32(0);
      newMember.didRagequit = false;
      newMember.proposedToKick = false;
      newMember.kicked = false;

      newMember.save();
    }

    let tokenId = molochId
      .concat("-token-")
      .concat(proposal.tributeToken.toHex());

    internalTransfer(
      molochId,
      ESCROW,
      proposal.applicant,
      tokenId,
      proposal.tributeOffered
    );
  }

  proposal.cancelled = true;
  proposal.save();
}


export function handleWithdrawEarnings(event: WithdrawEarnings): void {

  log.info(
    "***********handleWithdraw tx {}, ammount, {}, from {}, memberAddress {}",
    [
      event.transaction.hash.toHex(),
      event.params.earningsToUser.toString(),
      event.params.redeemedTokens.toString(),
      event.transaction.from.toHex(),
      event.params.memberAddress.toHex(),
    ]
  );

  let molochId = event.address.toHexString();
  let moloch = Moloch.load(molochId);

  let memberId = molochId
  .concat("-member-")
  .concat(event.params.memberAddress.toHex());
  let member = Member.load(memberId);

  let idleTokenId = molochId.concat("-token-").concat(moloch.idleToken);
  let depositTokenId = molochId.concat("-token-").concat(moloch.depositToken);
  let redeemedTokens = event.params.redeemedTokens;

  // increments member's iToken Redemptions 
  member.iTokenRedemptions = member.iTokenRedemptions.plus(redeemedTokens);

  // captures token conversions and transfers
  if (event.params.earningsToUser > BigInt.fromI32(0)) {
    subtractFromBalance(
      molochId,
      GUILD,
      idleTokenId,
      event.params.earningsToUser
    );
    addToBalance(
      molochId, 
      GUILD, 
      depositTokenId, 
      redeemedTokens
    );
    internalTransfer(
      molochId,
      GUILD,
      event.params.memberAddress,
      depositTokenId,
      redeemedTokens
    );
  }
  member.save();
}


export function handleWithdraw(event: Withdraw): void {
  // let memberAddress = event.params.memberAddress;

  log.info(
    "***********handleWithdraw tx {}, ammount, {}, from {}, memberAddress {}",
    [
      event.transaction.hash.toHex(),
      event.params.amount.toString(),
      event.transaction.from.toHex(),
      event.params.memberAddress.toHex(),
    ]
  );

  let molochId = event.address.toHexString();

  let tokenId = molochId.concat("-token-").concat(event.params.token.toHex());

  if (event.params.amount > BigInt.fromI32(0)) {
    subtractFromBalance(
      molochId,
      event.params.memberAddress,
      tokenId,
      event.params.amount
    );
  }
}

export function handleTokensCollected(event: TokensCollected): void {
  let molochId = event.address.toHexString();
  let tokenId = molochId.concat("-token-").concat(event.params.token.toHex());

  addToBalance(molochId, GUILD, tokenId, event.params.amountToCollect);
}