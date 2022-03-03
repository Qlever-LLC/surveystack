import { db } from '../db';
import { ObjectId } from 'mongodb';

import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';


/**
 * 
 * Return a list of farmos instances associated with user
 * 
 */
export const getFarmOSInstances = async (req, res) => {
  /**
   * A flat list of instances the user has access to for the farm question type
   */
  return res.send([]);
};


/**
 * 
 * 
 * get a list of assets (fields, plantings, etc.)
 */
export const getAssets = async (req, res) => {
  /**
   * A list of assets the user has access to for the farm question type
   * include instance url for each asset 
   */
  return res.send([]);
}

/**
 * get list of logs
 */
export const getLogs = async (req, res) => {

  /**
   * A list of logs the user has access to
   * include instance url for each log
   */
  return res.send([]);
}

/**
 * Return all instances for group with mappings
 */
export const getInstancesForGroup = async (req, res) => {
  return res.send([])
}

/**
 * get list of farms that are connectable to users of group
 */
export const getConnectableFarmsForGroup = async (req, res) => {

  /**
   * 1. only admins can do this, they pass a user from a group or subgroup
   * 2. get tagged farms from aggregator for this group and its subgroups
   */
}

/** 
 * update mapped instances for group
 */
export const updateInstancesForGroup = async (req, res) => {
  return res.send([])
}

/**
 * get list of instances for user, including who has access to them
 */
export const getInstancesForUser = async (req, res) => {
   /**
   * 1. For this user list all instances that the user has access to
   * 2. indicate if owner or not
   * 3. list groups with access to the farm if owner
   * 4. list other users with access to the farm
   */
  return res.send([])
}

/**
 * add / remove instance from user
 */
export const updateInstancesForUser = async (req, res) => {
  return res.send([])
}

/**
 * change ownership of an instance
 */
export const changeOwnershipForInstace = async (req, res) => {
  return res.send([])
}

/**
 * Super Admin can map instance to any user 
 */
export const assignFarmOSInstanceToUser = async (req, res) => {
  return res.send([])
}

