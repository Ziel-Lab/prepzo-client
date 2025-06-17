"use client";

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TalkToAgentContent from '@/components/dashboard/TalkToAgent/talkToAgent';

const MyAgentPage = () => {
    return (
        <DashboardLayout>
            <TalkToAgentContent />
        </DashboardLayout>
    );
};

export default MyAgentPage;
