// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Voting is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct ValidatorAssignment {
        address validator;
        bytes32 contributionId;
        uint256 assignedAt;
        bool completed;
    }

    struct VoteRecord {
        address validator;
        bytes32 contributionId;
        bool approve;
        uint256 timestamp;
        bool cast;
    }

    struct ContributionVote {
        bytes32 contributionId;
        address volunteer;
        uint256 approvalCount;
        uint256 rejectionCount;
        bool finalized;
        address[5] validators;
        mapping(address => VoteRecord) votes;
        uint256 voteCount;
    }

    mapping(bytes32 => ContributionVote) internal _contributionVotes;
    mapping(address => uint256) internal _validatorVotes;
    mapping(address => bool) internal _isValidator;
    mapping(bytes32 => ValidatorAssignment[]) internal _validatorAssignments;
    ValidatorAssignment[] internal _allAssignments;

    AggregatorV3Interface internal priceFeed;

    event ValidatorAssigned(
        bytes32 indexed contributionId,
        address indexed validator,
        uint256 indexed assignmentId
    );

    event VoteCast(
        bytes32 indexed contributionId,
        address indexed validator,
        bool approve,
        uint256 timestamp
    );

    event ConsensusReached(
        bytes32 indexed contributionId,
        bool approved,
        uint256 approvalCount,
        uint256 timestamp
    );

    event ValidatorRegistered(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    modifier onlyValidator() {
        require(_isValidator[msg.sender], "Voting: Not a registered validator");
        _;
    }

    modifier contributionNotFinalized(bytes32 contributionId) {
        require(
            !_contributionVotes[contributionId].finalized,
            "Voting: Contribution already finalized"
        );
        _;
    }

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    function registerValidator(address validator) external onlyOwner {
        require(validator != address(0), "Voting: Invalid validator address");
        require(!_isValidator[validator], "Voting: Validator already registered");

        _isValidator[validator] = true;

        emit ValidatorRegistered(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(_isValidator[validator], "Voting: Validator not registered");

        _isValidator[validator] = false;

        emit ValidatorRemoved(validator);
    }

    function isValidator(address validator) external view returns (bool) {
        return _isValidator[validator];
    }

    function assignValidators(bytes32 contributionId, address[5] memory validators) external onlyOwner {
        require(
            validators.length == 5,
            "Voting: Must provide exactly 5 validators"
        );
        require(
            !_contributionVotes[contributionId].finalized,
            "Voting: Contribution already finalized"
        );

        for (uint256 i = 0; i < 5; i++) {
            require(
                _isValidator[validators[i]],
                "Voting: All validators must be registered"
            );
        }

        uint256 assignmentId = _allAssignments.length;
        _allAssignments.push(ValidatorAssignment({
            validator: address(0),
            contributionId: contributionId,
            assignedAt: block.timestamp,
            completed: false
        }));

        for (uint256 i = 0; i < 5; i++) {
            bytes32 contributionIdHash = keccak256(abi.encodePacked(
                contributionId,
                validators[i],
                block.timestamp
            ));

            _contributionVotes[contributionIdHash] = ContributionVote({
                contributionId: contributionId,
                volunteer: address(0),
                approvalCount: 0,
                rejectionCount: 0,
                finalized: false,
                validators: validators,
                voteCount: 0
            });

            _validatorAssignments[contributionIdHash].push(
                ValidatorAssignment({
                    validator: validators[i],
                    contributionId: contributionIdHash,
                    assignedAt: block.timestamp,
                    completed: false
                })
            );

            emit ValidatorAssigned(contributionIdHash, validators[i], assignmentId + i);
        }
    }

    function castVote(
        bytes32 contributionId,
        bool approve
    ) external onlyValidator contributionNotFinalized(contributionId) {
        require(
            _contributionVotes[contributionId].voteCount < 5,
            "Voting: All votes already cast"
        );

        VoteRecord storage vote = _contributionVotes[contributionId].votes[msg.sender];
        require(!vote.cast, "Voting: Validator already voted");

        vote.validator = msg.sender;
        vote.contributionId = contributionId;
        vote.approve = approve;
        vote.timestamp = block.timestamp;
        vote.cast = true;

        _contributionVotes[contributionId].voteCount += 1;

        if (approve) {
            _contributionVotes[contributionId].approvalCount += 1;
        } else {
            _contributionVotes[contributionId].rejectionCount += 1;
        }

        emit VoteCast(contributionId, msg.sender, approve, block.timestamp);

        if (_contributionVotes[contributionId].approvalCount >= 3) {
            _contributionVotes[contributionId].finalized = true;
            emit ConsensusReached(contributionId, true, _contributionVotes[contributionId].approvalCount, block.timestamp);
        } else if (_contributionVotes[contributionId].rejectionCount == 5) {
            _contributionVotes[contributionId].finalized = true;
            emit ConsensusReached(contributionId, false, _contributionVotes[contributionId].rejectionCount, block.timestamp);
        }
    }

    function getVoteStatus(
        bytes32 contributionId
    ) external view returns (uint256 approvalCount, uint256 rejectionCount, bool finalized) {
        return (
            _contributionVotes[contributionId].approvalCount,
            _contributionVotes[contributionId].rejectionCount,
            _contributionVotes[contributionId].finalized
        );
    }

    function getVoteRecord(
        bytes32 contributionId,
        address validator
    ) external view returns (VoteRecord memory) {
        return _contributionVotes[contributionId].votes[validator];
    }

    function getValidatorAssignments(
        bytes32 contributionId
    ) external view returns (ValidatorAssignment[] memory) {
        return _validatorAssignments[contributionId];
    }

    function isVoteCasted(
        bytes32 contributionId,
        address validator
    ) external view returns (bool) {
        return _contributionVotes[contributionId].votes[validator].cast;
    }

    function getAllValidatorAssignments() external view returns (ValidatorAssignment[] memory) {
        return _allAssignments;
    }

    function getVoteCount(bytes32 contributionId) external view returns (uint256) {
        return _contributionVotes[contributionId].voteCount;
    }

    function getCurrentEthPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function addPriceFeed(address newPriceFeedAddress) external onlyOwner {
        priceFeed = AggregatorV3Interface(newPriceFeedAddress);
    }
}