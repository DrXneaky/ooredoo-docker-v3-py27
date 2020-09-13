from crontab import CronTab
import platform
import datetime
from croniter import croniter
from config import Config
from jinja2 import Environment, PackageLoader, select_autoescape
import os


class MyCronTab(object):
    MyCronTab = CronTab()

    def __init__(self):
        if (platform.system() == 'Windows'):
            self.MyCronTab = CronTab()
        else:
            self.MyCronTab = CronTab(user='root')

    def get_last_run_from_log(cron_job):
        try:
            cron_history_file = open(
                Config.CRON_LOG_DIRECTORY + 'cron'+str(cron_job.id)+'-history.log', 'r')
            Lines = cron_history_file.readlines()

            # get last line from cron history file

            if Lines != []:
                last_run_line = Lines[len(Lines)-1].strip().rsplit(' ', 1)[0]
                last_run = datetime.datetime.strptime(
                    last_run_line, '%a %b %d %H:%M:%S %Z %Y')
                if cron_job.status == 'Not Yet':
                    status = 'Enabled'
                else:
                    status = cron_job.status
            else:
                last_run = None
                status = cron_job.status
            return last_run, status
        except FileNotFoundError:
            return None, cron_job.status

        ######################################################
        ### Convert log file into a dict and read last run ###
        #####################################################

        # cron_iter = croniter(cron_job.expression, datetime.datetime.now())
        # get_prev = cron_iter.get_prev(datetime.datetime)
        # last_run = None
        # status = 'Not Yet'
        # if (cron_job.creationDate < get_prev):
        #     last_run = get_prev
        #     status = 'Enabled'
        # return last_run, status

    def cmd_woutput_log(base_command, id):
        return " ".join([base_command, '>', Config.CRON_LOG_DIRECTORY+Config.CRON_LOGGING_FORMAT.format(id), '2>&1'])

    def cmd_woutput_mail(base_command, mail_subject):
        return " ".join([base_command, "|&", "msmtp", Config.CRON_DESTINATION_EMAIL])

    def cmd_woutput_log_mail(base_command, id, mail_subject):
        return " ".join([base_command, '|&', 'tee', Config.CRON_LOG_DIRECTORY+Config.CRON_LOGGING_FORMAT.format(id), '|&', 'msmtp', Config.CRON_DESTINATION_EMAIL])

    def create_cron_shell_script(id, command):
        env = Config.CRON_ENV
        template = env.get_template('cron_script_template.txt')
        print(template.render(id=id, command=command))
        return template.render(id=id, command=command)

    def write_cron_shell_file(id, text):

        if (platform.system() == 'Windows'):
            script_path = Config.APPLICATION_PATH + \
                '\\ressources\\cron\\shell\\cron_script{0}.sh'.format(id)
            shell_script_file = open(script_path, 'w+')
        else:
            script_path = Config.CRON_SCRIPT_DIRECTORY + \
                'cron_script{0}.sh'.format(id)
            shell_script_file = open(script_path, 'w+')

        shell_script_file.write(text)
        shell_script_file.close()
        return script_path
