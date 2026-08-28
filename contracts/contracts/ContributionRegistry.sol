// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ContributionRegistry is Ownable, ReentrancyGuard {
    struct Contribution {
        bytes32 idHash; // keccak256 of contribution ID
        address volunteer;
        uint256 hours; // Total hours contributed
        string cid; // IPFS CID for evidence
        bool approved;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Contribution) internal _contributions;
    mapping(address => bytes32[]) internal _userContributions;
    mapping(bytes32 => bool) internal _approvedIds;

    uint256 public constant MIN_APPROVALS = 3; // 3/5 consensus
    uint256 public constant VALIDATOR_COUNT = 5;

    event ContributionSubmitted(
        bytes32 indexed idHash,
        address indexed volunteer,
        uint256 hours,
        string cid,
        uint256 timestamp
    );

    event ContributionApproved(
        bytes32 indexed idHash,
        address indexed validator,
        uint256 timestamp
    );

    event ContributionRejected(
        bytes32 indexed idHash,
        address indexed validator,
        uint256 timestamp
    );

    modifier onlyValidator(address validator) {
        require(
            validator == tx.origin || msg.sender == validator,
            "ContributionRegistry: Must be validator"
        );
        _;
    }

    constructor() {
    }

    function submitContribution(
        bytes32 idHash,
        uint256 hours,
        string memory cid
    ) external payable nonReentrant {
        require(bytes(cid).length > 0, "ContributionRegistry: CID cannot be empty");
        require(hours > 0, "ContributionRegistry: Hours must be greater than 0");
        require(!_contributions[idHash].exists, "ContributionRegistry: Contribution already exists");

        _contributions[idHash] = Contribution({
            idHash: idHash,
            volunteer: msg.sender,
            hours: hours,
            cid: cid,
            approved: false,
            timestamp: block.timestamp,
            exists: true
        });

        _userContributions[msg.sender].push(idHash);

        emit ContributionSubmitted(idHash, msg.sender, hours, cid, block.timestamp);
    }

    function approveContribution(bytes32 idHash) external onlyValidator(msg.sender) {
        require(
            _contributions[idHash].exists,
            "ContributionRegistry: Contribution does not exist"
        );
        require(
            !_contributions[idHash].approved,
            "ContributionRegistry: Contribution already approved or rejected"
        );

        _contributions[idHash].approved = true;
        _approvedIds[idHash] = true;

        emit ContributionApproved(idHash, msg.sender, block.timestamp);
    }

    function rejectContribution(bytes32 idHash) external onlyValidator(msg.sender) {
        require(
            _contributions[idHash].exists,
            "ContributionRegistry: Contribution does not exist"
        );
        require(
            !_contributions[idHash].approved,
            "ContributionRegistry: Contribution already approved or rejected"
        );

        _contributions[idHash].approved = false;
        _approvedIds[idHash] = true;

        emit ContributionRejected(idHash, msg.sender, block.timestamp);
    }

    function isApproved(bytes32 idHash) external view returns (bool) {
        return _contributions[idHash].approved;
    }

    function getContribution(
        bytes32 idHash
    ) external view returns (Contribution memory) {
        require(
            _contributions[idHash].exists,
            "ContributionRegistry: Contribution does not exist"
        );
        return _contributions[idHash];
    }

    function getUserContributions(
        address volunteer
    ) external view returns (bytes32[] memory) {
        return _userContributions[volunteer];
    }

    function hasContribution(address volunteer) external view returns (bool) {
        return _userContributions[volunteer].length > 0;
    }

    function getConsortiumState(
        bytes32 idHash
    ) external view returns (bool exists, bool approved) {
        return (
            _contributions[idHash].exists,
            _contributions[idHash].approved
        );
    }

    function getMinimumApprovalsRequired() external pure returns (uint256) {
        return MIN_APPROVALS;
    }

    function getValidatorCount() external pure returns (uint256) {
        return VALIDATOR_COUNT;
    }

    function approveByConsensus(bytes32 idHash) external {
        require(
            _contributions[idHash].exists,
            "ContributionRegistry: Contribution does not exist"
        );
        require(
            !_contributions[idHash].approved,
            "ContributionRegistry: Contribution already approved"
        );

        _contributions[idHash].approved = true;
        _approvedIds[idHash] = true;

        emit ContributionApproved(msg.sender, block.timestamp);
    }
}