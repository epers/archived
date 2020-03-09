/*
 * getinvite.cpp
 *
 * Allows users to retrieve their invites from the keylist.db file.
 *
 * Version 2.0 - Completely re-written (This time with slightly less drugs!)
 * Now with readable code and some semblance of organization!
 * (And much better error handling!)
 *
 * Author Contact: imaweasal@gmail.com
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <unistd.h>
#include <stdlib.h>

#include "functions.h"

using namespace std;

int main ()
{
  return getInvites (getenv ("USER"));
}
