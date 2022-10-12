<template>
    <div class="member-rows">
        <FarmOSMemberRow class="mb-1" v-for="member in remappedMembers" :key="`user-${member.id}`" :user="member"
            :instance-map="member.farms" />
    </div>
</template>

<script>
import FarmOSMemberRow from './FarmOSMemberRow.vue'

export default {
    components: {
        FarmOSMemberRow,
    },
    props: [
        "members",
    ],
    computed: {
        remappedMembers() {
            return this.members.map(m => {

                const farms = m.connectedFarms.map(f => ({
                    name: f.instanceName,
                    groups: f.groups.map(g => ({
                        name: g.name,
                        id: g.groupId,
                        path: g.path
                    }))
                }))

                return {
                    id: m.user,
                    admin: m.admin,
                    email: m.email,
                    name: m.name,
                    farms,
                }
            })
        }
    }
}
</script>