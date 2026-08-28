// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract Governance is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        uint256 endTime;
        uint256 startTime;
        bool exists;
    }

    struct MemberVote {
        address voter;
        uint256 proposalId;
        bool support; // true = FOR, false = AGAINST
        bool hasVoted;
        uint256 votingPower;
    }

    mapping(uint256 => Proposal) internal _proposals;
    mapping(uint256 => MemberVote[]) internal _proposalVotes;
    mapping(address => bool) internal _isMember;
    mapping(address => bool) internal _hasVotedOnProposal;

    Counters.Counter internal _proposalCount;

    uint256 public constant VOTING_DURATION = 86400; // 24 hours
    uint256 public constant QUORUM = 10; // 10% of members need to vote
    uint256 public constant MIN_FOR_VOTES = 50; // Need 50% approval

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower,
        uint256 timestamp
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 timestamp
    );

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    modifier onlyMember() {
        require(_isMember[msg.sender], "Governance: Not a member");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(_proposals[proposalId].exists, "Governance: Proposal does not exist");
        _;
    }

    modifier notExecuted(uint256 proposalId) {
        require(!_proposals[proposalId].executed, "Governance: Proposal already executed");
        _;
    }

    modifier votingPeriod(uint256 proposalId) {
        require(
            block.timestamp >= _proposals[proposalId].startTime &&
            block.timestamp <= _proposals[proposalId].endTime,
            "Governance: Not in voting period"
        );
        _;
    }

    constructor() {
    }

    function addMember(address member) external onlyOwner {
        require(member != address(0), "Governance: Invalid member address");
        require(!_isMember[member], "Governance: Member already exists");

        _isMember[member] = true;

        emit MemberAdded(member);
    }

    function removeMember(address member) external onlyOwner {
        require(_isMember[member], "Governance: Member not found");

        _isMember[member] = false;

        emit MemberRemoved(member);
    }

    function isMember(address member) external view returns (bool) {
        return _isMember[member];
    }

    function createProposal(string memory description) external onlyMember {
        require(bytes(description).length > 0, "Governance: Description cannot be empty");

        _proposalCount.increment();
        uint256 proposalId = _proposalCount.current();

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            endTime: block.timestamp + VOTING_DURATION,
            startTime: block.timestamp,
            exists: true
        });

        emit ProposalCreated(proposalId, msg.sender, description, block.timestamp, block.timestamp + VOTING_DURATION);
    }

    function castVote(
        uint256 proposalId,
        bool support
    ) external onlyMember proposalExists(proposalId) notExecuted(proposalId) votingPeriod(proposalId) {
        require(!_hasVotedOnProposal[msg.sender], "Governance: Already voted on this proposal");

        uint256 votingPower = 1; // Each member has 1 vote in this implementation

        _proposalVotes[proposalId].push(MemberVote({
            voter: msg.sender,
            proposalId: proposalId,
            support: support,
            hasVoted: true,
            votingPower: votingPower
        }));

        _hasVotedOnProposal[msg.sender] = true;

        if (support) {
            _proposals[proposalId].forVotes += votingPower;
        } else {
            _proposals[proposalId].againstVotes += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, support, votingPower, block.timestamp);
    }

    function executeProposal(uint256 proposalId) external onlyMember proposalExists(proposalId) notExecuted(proposalId) {
        require(
            block.timestamp > _proposals[proposalId].endTime,
            "Governance: Voting period not over"
        );

        uint256 totalVotes = _proposals[proposalId].forVotes + _proposals[proposalId].againstVotes;
        require(totalVotes >= QUORUM, "Governance: Quorum not reached");

        if (_proposals[proposalId].forVotes > _proposals[proposalId].againstVotes) {
            require(
                _proposals[proposalId].forVotes >= MIN_FOR_VOTES,
                "Governance: Not enough support"
            );

            _proposals[proposalId].executed = true;

            emit ProposalExecuted(proposalId, _proposals[proposalId].forVotes, _proposals[proposalId].againstVotes, block.timestamp);
        } else {
            revert("Governance: Proposal not approved");
        }
    }

    function getProposal(uint256 proposalId) external view proposalExists(proposalId) returns (Proposal memory) {
        return _proposals[proposalId];
    }

    function getProposalVotes(uint256 proposalId) external view proposalExists(proposalId) returns (MemberVote[] memory) {
        return _proposalVotes[proposalId];
    }

    function isProposalActive(uint256 proposalId) external view proposalExists(proposalId) returns (bool) {
        return !(_proposals[proposalId].executed) && block.timestamp < _proposals[proposalId].endTime;
    }

    function getMemberCount() external view returns (uint256) {
        uint256 count = 0;
        address[100] memory tempMembers;
        uint256 index = 0;

        for (uint256 i = 1; i <= _proposalCount.current(); i++) {
            if (_proposals[i].exists) {
                tempMembers[index] = _proposals[i].proposer;
                index++;
            }
        }

        for (uint256 i = 0; i < index; i++) {
            if (_isMember[tempMembers[i]]) {
                count++;
            }
        }

        return count;
    }

    function getTotalProposals() external view returns (uint256) {
        return _proposalCount.current();
    }

    function getRemainingVotingTime(uint256 proposalId) external view proposalExists(proposalId) returns (uint256) {
        if (block.timestamp >= _proposals[proposalId].endTime) {
            return 0;
        }
        return _proposals[proposalId].endTime - block.timestamp;
    }

    function getVoteRatio(uint256 proposalId) external view proposalExists(proposalId) returns (uint256 forRatio, uint256 againstRatio) {
        uint256 totalVotes = _proposals[proposalId].forVotes + _proposals[proposalId].againstVotes;
        if (totalVotes == 0) {
            return (0, 0);
        }

        forRatio = (_proposals[proposalId].forVotes * 100) / totalVotes;
        againstRatio = (_proposals[proposalId].againstVotes * 100) / totalVotes;
    }

    function updateVotingDuration(uint256 newDuration) external onlyOwner {
        require(newDuration > 0, "Governance: Duration must be greater than 0");
        VOTING_DURATION = newDuration;
    }

    function updateQuorum(uint256 newQuorum) external onlyOwner {
        require(newQuorum > 0, "Governance: Quorum must be greater than 0");
        QUORUM = newQuorum;
    }

    function updateMinForVotes(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Governance: Min for votes must be greater than 0");
        MIN_FOR_VOTES = newMin;
    }

    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}

    fallback() external payable {}
}